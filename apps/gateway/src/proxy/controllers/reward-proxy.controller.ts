import {
  ProxyRequestService,
  ProxyRequestOptions,
} from '@app/gateway/proxy/services/proxy-request.service';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  Controller,
  Inject,
  Post,
  Req,
  Res,
  Get,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiQuery,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { CreateRewardRequestDto } from '@app/event/reward/presentation/dtos/request/reward.request.dto';
import { RewardResponseDto } from '@app/event/reward/presentation/dtos/response/reward.response.dto';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import { createRewardExamples } from '@app/common/swagger/examples/reward.example';

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

  @Post(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: '이벤트에 보상 생성 (운영자/관리자)' })
  @ApiParam({
    name: 'eventId',
    type: String,
    description: '이벤트 ID',
  })
  @ApiBearerAuth('accessToken')
  @ApiBody({ type: CreateRewardRequestDto, examples: createRewardExamples })
  @ApiCreatedResponse({
    description: '보상 생성 성공',
    type: RewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 (DTO 유효성, 비즈니스 규칙 위반 등)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패 (JWT 누락 / 내부 서버에 헤더 전달 누락)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (예: 일반 유저가 생성 시도)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 동일한 보상 존재 (이름 또는 내용 기준)',
  })
  async createRewardForEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleRewardProxy(req, res);
  }

  @Get()
  @ApiOperation({
    summary: '특정 이벤트에 연결된 보상 목록 조회 (모든 인증된 사용자)',
  })
  @ApiQuery({
    name: 'eventId',
    required: true,
    type: String,
    description: '이벤트 ID',
  })
  @ApiOkResponse({
    description: '보상 목록 조회 성공',
    type: [RewardResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 eventId의 이벤트를 찾을 수 없음',
  })
  async listRewardsForEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleRewardProxy(req, res, { injectUserInfo: false });
  }
}
