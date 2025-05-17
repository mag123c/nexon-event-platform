import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import { CreateEventUseCase } from '@app/event/application/use-cases/craete-event/create-event.usecase';
import { CreateEventRequestDto } from '@app/event/presentation/dtos/request/event.request.dto';
import { EventResponseDto } from '@app/event/presentation/dtos/response/event.response.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ApiInternalHeaders } from '@app/common/decorators/internal-headers.decorator';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';

@ApiTags('Event')
@ApiInternalHeaders()
@Controller('events')
export class EventController {
  constructor(private readonly createEventUseCase: CreateEventUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
      conditions: createEventDto.conditions.map((c) => ({
        category: c.category,
        type: c.type,
        operator: c.operator,
        value: c.value,
        unit: c.unit,
        description: c.description,
      })),
      requiresManualApproval: createEventDto.requiresManualApproval,
      createdBy: currentUser.id,
    };

    const createdEvent = await this.createEventUseCase.execute(useCaseInput);
    return EventResponseDto.fromEntity(createdEvent);
  }
}
