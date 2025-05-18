import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
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
