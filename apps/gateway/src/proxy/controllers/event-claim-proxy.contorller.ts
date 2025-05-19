import { Role } from '@app/auth/domain/value-objects/role.vo';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import {
  ProxyRequestService,
  ProxyRequestOptions,
} from '@app/gateway/proxy/services/proxy-request.service';
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';

@ApiTags('Gateway - Event Claim Service Proxy')
@Controller('claims')
export class EventClaimProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  private async handleClaimProxy(
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

  @ApiOperation({ summary: '이벤트 보상 요청' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER)
  @Post(':eventId')
  async claimReward(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }

  @ApiOperation({ summary: '내 보상 요청 이력 조회' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('me')
  async listMyClaims(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }

  @ApiOperation({
    summary: '전체 또는 필터링된 보상 요청 이력 조회 (관리자용)',
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @Get('admin')
  async listAllClaims(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }
}
