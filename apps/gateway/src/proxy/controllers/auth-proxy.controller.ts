import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import {
  ProxyRequestOptions,
  ProxyRequestService,
} from '@app/gateway/proxy/services/proxy-request.service';
import { Controller, Req, Res, Inject, Post } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

@ApiTags('Gateway - Auth Service Proxy')
@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  // 공통 핸들러 로직
  private async handleAuthProxy(
    req: Request,
    res: Response,
    serviceUrl: string,
    options: ProxyRequestOptions,
  ) {
    const serviceResponse = await this.proxyRequestService.forwardRequest(
      req,
      serviceUrl,
      options,
    );
    res.status(serviceResponse.status).json(serviceResponse.data);
  }

  @ApiOperation({
    summary: '회원가입',
    description: '회원가입 및 로그인은 모든 사용자에게 공개됩니다.',
  })
  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.handleAuthProxy(req, res, this.config.authServiceUrl, {
      stripPrefix: '/api/v1',
      injectUserInfo: false,
    });
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '로그인은 모든 사용자에게 공개됩니다.',
  })
  async login(@Req() req: Request, @Res() res: Response) {
    await this.handleAuthProxy(req, res, this.config.authServiceUrl, {
      stripPrefix: '/api/v1',
      injectUserInfo: false,
    });
  }
}
