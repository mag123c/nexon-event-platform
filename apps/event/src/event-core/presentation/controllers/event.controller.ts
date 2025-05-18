import { CreateEventInput } from '@app/event/event-core/application/use-cases/craete-event/craete-event.input';
import { CreateEventUseCase } from '@app/event/event-core/application/use-cases/craete-event/create-event.usecase';
import { CreateEventRequestDto } from '@app/event/event-core/presentation/dtos/request/event.request.dto';
import { EventResponseDto } from '@app/event/event-core/presentation/dtos/response/event.response.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';

@ApiTags('Event')
@ApiSecurity('x-internal-api-key')
@ApiInternalHeaders()
@Controller('events')
export class EventController {
  constructor(private readonly createEventUseCase: CreateEventUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
}
