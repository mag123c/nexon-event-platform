import { UserDocument } from '@app/auth/domain/entities/user.entity';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { CurrentUser } from '@app/gateway/auth/decorators/current-user.decorator';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import { CreateEventUseCase } from '@app/event/application/use-cases/craete-event/create-event.usecase';
import { CreateEventRequestDto } from '@app/event/presentation/dtos/request/event.request.dto';
import { EventResponseDto } from '@app/event/presentation/dtos/response/event.response.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('Event')
@ApiBearerAuth('accessToken')
@Controller('events')
export class EventController {
  constructor(private readonly createEventUseCase: CreateEventUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
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
    @CurrentUser() currentUser: UserDocument,
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
      createdBy: currentUser._id.toHexString(),
    };

    const createdEvent = await this.createEventUseCase.execute(useCaseInput);
    return EventResponseDto.fromEntity(createdEvent);
  }
}
