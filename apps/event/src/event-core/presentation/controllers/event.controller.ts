import { CreateEventInput } from '@app/event/event-core/application/use-cases/craete-event/craete-event.input';
import { CreateEventUseCase } from '@app/event/event-core/application/use-cases/craete-event/create-event.usecase';
import { CreateEventRequestDto } from '@app/event/event-core/presentation/dtos/request/event.request.dto';
import { EventResponseDto } from '@app/event/event-core/presentation/dtos/response/event.response.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ListEventsQueryDto } from '@app/event/event-core/presentation/dtos/request/list-event-query.dto';
import { EventDetailResponseDto } from '@app/event/event-core/presentation/dtos/response/event-detail.response.dto';
import { PaginatedEventsResponseDto } from '@app/event/event-core/presentation/dtos/response/paginated-events.response.dto';
import { GetEventByIdUseCase } from '@app/event/event-core/application/use-cases/get-event-by-id/get-event-by-id.usecase';
import { ListEventsUseCase } from '@app/event/event-core/application/use-cases/list-event/list-event.usecase';
import { ListEventsUseCaseOutput } from '@app/event/event-core/application/use-cases/list-event/list-event.output';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { Role } from '@app/auth/domain/value-objects/role.vo';

@ApiTags('Event')
@ApiSecurity('x-internal-api-key')
@ApiInternalHeaders()
@Controller('events')
export class EventController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiSecurity('x-user-id')
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiBody({ type: CreateEventRequestDto })
  @ApiCreatedResponse({
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Insufficient role).' })
  async createEvent(
    @Body() createEventDto: CreateEventRequestDto,
    @InternalUser() currentUser: InternalUserContext,
  ): Promise<EventResponseDto> {
    const useCaseInput: CreateEventInput = {
      name: createEventDto.name,
      description: createEventDto.description,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      status: createEventDto.status,
      condition: createEventDto.condition,
      requiresManualApproval: createEventDto.requiresManualApproval,
      createdBy: currentUser.id,
    };

    const createdEvent = await this.createEventUseCase.execute(useCaseInput);
    return EventResponseDto.fromEntity(createdEvent);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이벤트 목록 조회' })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: '이벤트 목록 조회 성공',
    type: PaginatedEventsResponseDto,
  })
  async listEvents(
    @Query() queryDto: ListEventsQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    const eventList: ListEventsUseCaseOutput =
      await this.listEventsUseCase.execute({
        name: queryDto.name,
        status: queryDto.status,
        page: queryDto.page,
        limit: queryDto.limit,
        sortBy: queryDto.sortBy,
        sortOrder: queryDto.sortOrder,
      });

    return PaginatedEventsResponseDto.from(
      eventList.events,
      eventList.totalCount,
      eventList.currentPage,
      queryDto.limit,
    );
  }

  @Get(':eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이벤트 상세 조회' })
  @ApiParam({
    name: 'eventId',
    description: '조회할 이벤트의 ID (ObjectId string)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '이벤트 상세 조회 성공',
    type: EventDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  async getEventById(
    @Param('eventId') eventId: string,
  ): Promise<EventDetailResponseDto> {
    const event = await this.getEventByIdUseCase.execute({ eventId });
    return EventDetailResponseDto.fromEventData(event);
  }
}
