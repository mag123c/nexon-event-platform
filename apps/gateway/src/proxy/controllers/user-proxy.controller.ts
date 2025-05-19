import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import {
  ProxyRequestService,
  ProxyRequestOptions,
} from '@app/gateway/proxy/services/proxy-request.service';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  Controller,
  Inject,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';

@ApiTags('Gateway - User Service Proxy (via Auth Service)')
@ApiSecurity(CustomHeaders.INTERNAL_API_KEY)
@Controller('users')
export class UserProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  private async handleUserProxy(
    req: Request,
    res: Response,
    options?: ProxyRequestOptions,
  ) {
    const serviceResponse = await this.proxyRequestService.forwardRequest(
      req,
      this.config.authServiceUrl,
      {
        stripPrefix: '/api/v1',
        injectUserInfo: options?.injectUserInfo ?? false,
      },
    );
    res.status(serviceResponse.status).json(serviceResponse.data);
  }

  @ApiOperation({
    summary:
      '특정 유저의 활동 데이터 조회 (내부 서비스 간 호출용이므로 게이트웨이에선 신중히 노출)',
  })
  @ApiParam({
    name: 'userId',
    description: '조회할 유저의 ID',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '유저를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증/인가 실패 (게이트웨이 또는 Auth 서버)',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken')
  @Get(':userId/activity-data')
  async getUserActivityData(@Req() req: Request, @Res() res: Response) {
    await this.handleUserProxy(req, res, { injectUserInfo: false });
  }
}
