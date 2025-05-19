import { Role } from '@app/auth/domain/value-objects/role.vo';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import {
  ProxyRequestOptions,
  ProxyRequestService,
} from '@app/gateway/proxy/services/proxy-request.service';
import {
  Controller,
  Inject,
  UseGuards,
  Req,
  Res,
  Post,
  Get,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';

@ApiTags('Gateway - Event Service Proxy')
@Controller('events')
export class EventProxyController {
  constructor(
    private readonly proxyRequestService: ProxyRequestService,
    @Inject(gatewayConfig.KEY)
    private readonly config: ConfigType<typeof gatewayConfig>,
  ) {}

  private async handleEventProxy(
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

  @ApiOperation({ summary: '이벤트 생성 (운영자/관리자)' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @Post('create')
  async createEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res);
  }

  @ApiOperation({
    summary: '이벤트 목록 조회',
    description: '이벤트 목록은 모든 사용자에게 공개됩니다.',
  })
  @Get()
  async listEvents(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res, { injectUserInfo: false });
  }

  @ApiOperation({
    summary: '이벤트 상세 조회',
    description: '이벤트 상세 정보는 모든 사용자에게 공개됩니다.',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':eventId')
  async getEventById(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res, { injectUserInfo: false });
  }
}
