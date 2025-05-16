import gatewayConfig from '@app/gateway/config/gateway.config';
import { ProxyRequestService } from '@app/gateway/proxy/services/proxy-request.service';
import { Controller, All, Req, Res, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  // 공통 핸들러 로직
  private async handleProxy(
    req: Request,
    res: Response,
    serviceUrl: string,
    options: any,
  ) {
    const serviceResponse = await this.proxyRequestService.forwardRequest(
      req,
      serviceUrl,
      options,
    );
    // ProxyRequestService가 성공적인 응답(4xx 포함)을 반환하면, 그 내용을 클라이언트에 전달
    res.status(serviceResponse.status).json(serviceResponse.data);
  }

  @All(['register', 'login'])
  async publicAuthRoutes(@Req() req: Request, @Res() res: Response) {
    await this.handleProxy(req, res, this.config.authServiceUrl, {
      stripPrefix: '/api/v1',
      injectUserInfo: false,
    });
  }
}
