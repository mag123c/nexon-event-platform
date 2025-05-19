import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import {
  ProxyRequestService,
  ProxyRequestOptions,
} from '@app/gateway/proxy/services/proxy-request.service';
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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';
import { UserActivityResponseDto } from '@app/auth/user/presentation/dtos/response/user-activity.response.dto';

@ApiTags('Gateway - Auth Service Proxy')
@ApiBearerAuth('accessToken')
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
    summary: '특정 유저의 활동 데이터 조회',
  })
  @ApiParam({
    name: 'userId',
    description: '조회할 유저의 ID (ObjectId string)',
    type: String,
  })
  @ApiOkResponse({
    type: UserActivityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '유저를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API 키 인증 실패',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':userId/activity-data')
  async getUserActivityData(@Req() req: Request, @Res() res: Response) {
    await this.handleUserProxy(req, res, { injectUserInfo: false });
  }
}
