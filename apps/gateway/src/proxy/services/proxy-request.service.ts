import { HttpService } from '@nestjs/axios';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import gatewayConfig from '../../config/gateway-proxy.config';

import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';
import { BaseError } from '@app/common';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  BadGatewayProxyException,
  ServiceUnavailableProxyException,
} from '@app/gateway/shared/errors/proxy.exception';

@Injectable()
export class ProxyRequestService {
  private readonly logger = new Logger(ProxyRequestService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  private getServiceName(targetUrl: string): string {
    try {
      const url = new URL(targetUrl);
      return url.hostname.split('-')[0] || 'Unknown Service';
    } catch {
      return 'Unknown Service';
    }
  }

  async forwardRequest(
    req: Request,
    targetBaseUrl: string,
    options?: {
      stripPrefix?: string;
      injectUserInfo?: boolean;
    },
  ): Promise<AxiosResponse<any, any>> {
    const { method, body, headers: originalHeaders, originalUrl } = req;
    const user = req.user as JwtPayload | undefined;

    let targetPath = originalUrl;
    if (options?.stripPrefix && originalUrl.startsWith(options.stripPrefix)) {
      targetPath = originalUrl.substring(options.stripPrefix.length);
    }
    const targetUrl = `${targetBaseUrl}${targetPath}`;
    const serviceName = this.getServiceName(targetBaseUrl);

    const headersToForward: Record<string, string> = {
      [CustomHeaders.INTERNAL_API_KEY]: this.config.internalApiKey,
    };
    if (originalHeaders['content-type']) {
      headersToForward['content-type'] = originalHeaders[
        'content-type'
      ] as string;
    }
    if (originalHeaders['accept']) {
      headersToForward['accept'] = originalHeaders['accept'] as string;
    }
    if (options?.injectUserInfo && user) {
      if (user.id) headersToForward[CustomHeaders.USER_ID] = user.id;
      if (user.roles && user.roles.length > 0) {
        headersToForward[CustomHeaders.USER_ROLES] = JSON.stringify(user.roles);
      }
    }

    const config: AxiosRequestConfig = {
      method: method as any,
      url: targetUrl,
      data: body,
      headers: headersToForward,
    };

    try {
      this.logger.log(`Forwarding request: ${method} ${targetUrl}`);
      const serviceResponse = await firstValueFrom(
        this.httpService.request(config),
      );

      // 내부 서비스가 4xx, 5xx 응답을 했을 경우 처리
      if (serviceResponse.status >= 400) {
        this.logger.warn(
          `Upstream service ${serviceName} responded with ${serviceResponse.status}`,
          serviceResponse.data,
        );

        // 400번대는 그대로 전달
        if (serviceResponse.status >= 500) {
          throw new BadGatewayProxyException(
            serviceName,
            serviceResponse.status,
            serviceResponse.data,
          );
        }
      }
      return serviceResponse;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Error proxying to ${serviceName} (${targetUrl}): ${axiosError.message}`,
        axiosError.stack,
      );

      if (axiosError.isAxiosError && !axiosError.response) {
        // 응답 자체가 없는 경우 (네트워크 에러, 타임아웃, DNS 조회 실패 등)
        throw new ServiceUnavailableProxyException(serviceName, axiosError);
      }

      // AxiosError인데 response가 있는 경우 (위에서 serviceResponse.status >= 500에서 처리되지 않은 경우)
      // 또는 try 블록 내에서 BadGatewayProxyException이 이미 던져진 경우
      if (axiosError.response) {
        throw new BadGatewayProxyException(
          serviceName,
          axiosError.response.status,
          axiosError.response.data,
        );
      }

      // 이미 BaseError 타입의 예외라면 (예: 위에서 던진 BadGatewayProxyException) 그대로 다시 던짐
      if (error instanceof BaseError) {
        throw error;
      }

      // 그 외 알 수 없는 에러
      throw new BadGatewayProxyException(serviceName, undefined, {
        originalError: axiosError.message,
      });
    }
  }
}
