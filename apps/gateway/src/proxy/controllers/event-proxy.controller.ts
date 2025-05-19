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
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import gatewayConfig from '@app/gateway/config/gateway-proxy.config';
import { Request, Response } from 'express';
import { CreateEventRequestDto } from '@app/event/event-core/presentation/dtos/request/event.request.dto';
import { EventResponseDto } from '@app/event/event-core/presentation/dtos/response/event.response.dto';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { PaginatedEventsResponseDto } from '@app/event/event-core/presentation/dtos/response/paginated-events.response.dto';
import { EventDetailResponseDto } from '@app/event/event-core/presentation/dtos/response/event-detail.response.dto';
import { createEventExamples } from '@app/common/swagger/examples/event.example';

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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: '이벤트 생성 (운영자/관리자)' })
  @ApiBearerAuth('accessToken')
  @ApiBody({ type: CreateEventRequestDto, examples: createEventExamples })
  @ApiCreatedResponse({
    type: EventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      '생성에 필요한 유효성 검사 실패(시작 - 종료일, 설정된 카테고리 - 타입 - 값 등)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인가 실패(내부 헤더)',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async createEvent(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res);
  }

  @Get()
  @ApiOperation({
    summary: '이벤트 목록 조회',
    description: '이벤트 목록은 모든 사용자에게 공개됩니다.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: '이벤트 이름 검색',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: '이벤트 상태 필터',
  })
  @ApiOkResponse({
    description: '이벤트 목록 조회 성공',
    type: PaginatedEventsResponseDto,
  })
  async listEvents(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res, { injectUserInfo: false });
  }

  @Get(':eventId')
  @ApiOperation({
    summary: '이벤트 상세 조회',
    description: '이벤트 상세 정보는 모든 사용자에게 공개됩니다.',
  })
  @ApiParam({
    name: 'eventId',
    description: '조회할 이벤트의 ID (ObjectId string)',
  })
  @ApiOkResponse({
    description: '이벤트 상세 조회 성공',
    type: EventDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  async getEventById(@Req() req: Request, @Res() res: Response) {
    await this.handleEventProxy(req, res, { injectUserInfo: false });
  }
}
