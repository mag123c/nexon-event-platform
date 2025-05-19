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
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiParam,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';
import { ClaimRewardResponseDto } from '@app/event/event-claim/presentation/dtos/response/event-claim.response.dto';
import { PaginatedEventClaimsResponseDto } from '@app/event/event-claim/presentation/dtos/response/paginated-event-claims.response.dto';

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

  @Post(':eventId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: '이벤트 보상 요청' })
  @ApiBearerAuth('accessToken')
  @ApiParam({ name: 'eventId', description: '이벤트 ID', type: String })
  @ApiCreatedResponse({
    description: '보상 요청 처리 완료 (성공 또는 예상된 실패 상태 포함)',
    type: ClaimRewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '보상 요청 기록 생성 성공',
    type: ClaimRewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 (DTO 유효성, 이벤트 상태 등)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패 (내부 API 키 누락/오류 등)',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 보상을 지급받음',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'event > auth 통신 오류 등',
  })
  async claimReward(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: '내 보상 요청 이력 조회' })
  @ApiBearerAuth('accessToken')
  @ApiOkResponse({
    description: '내 보상 요청 이력 조회 성공',
    type: PaginatedEventClaimsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (USER 역할이 아님)',
  })
  async listMyClaims(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @ApiOperation({
    summary: '전체 또는 필터링된 보상 요청 이력 조회 (관리자용)',
  })
  @ApiBearerAuth('accessToken')
  @ApiOkResponse({
    description: '보상 요청 이력 조회 성공',
    type: PaginatedEventClaimsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async listAllClaims(@Req() req: Request, @Res() res: Response) {
    await this.handleClaimProxy(req, res);
  }
}
