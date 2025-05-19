import { Role } from '@app/auth/domain/value-objects/role.vo';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import {
  ProxyRequestService,
  ProxyRequestOptions,
} from '@app/gateway/proxy/services/proxy-request.service';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  Controller,
  Inject,
  UseGuards,
  Post,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';

@ApiTags('Gateway - Reward Service Proxy')
@ApiSecurity(CustomHeaders.INTERNAL_API_KEY)
@Controller('rewards')
export class RewardProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  private async handleRewardProxy(
    req: Request,
    res: Response,
    options?: ProxyRequestOptions,
  ) {
    const serviceResponse = await this.proxyRequestService.forwardRequest(
      req,
      this.config.eventServiceUrl,
      {
        stripPrefix: '/api/v1',
        injectUserInfo: options?.injectUserInfo ?? true,
      },
    );
    res.status(serviceResponse.status).json(serviceResponse.data);
  }

  @ApiOperation({ summary: '이벤트에 보상 생성 (운영자/관리자)' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Post(':eventId')
  async createRewardForEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleRewardProxy(req, res);
  }

  @ApiOperation({
    summary: '특정 이벤트에 연결된 보상 목록 조회 (모든 인증된 사용자)',
  })
  @Get()
  async listRewardsForEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleRewardProxy(req, res, { injectUserInfo: false });
  }
}
