import { SUPPORTED_EVENT_TYPES } from '@app/event/application/config/event-condition.config';
import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/domain/event/ports/event.repository';
import { EventStatus } from '@app/event/domain/event/value-objects/event-status.vo';
import { Injectable, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
import { Event } from '@app/event/domain/event/entities/event.entity';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { EventAlreadyExistsException } from '@app/event/domain/event/errors/event-already-exists.exception';
import { InvalidEventPeriodException } from '@app/event/domain/event/errors/invalid-event-period.exception';
import { UnsupportedEventConditionTypeException } from '@app/event/domain/event/errors/unsupported-event-condition-type.exception';

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    if (await this.eventRepository.findByName(input.name)) {
      throw new EventAlreadyExistsException(input.name);
    }

    if (input.startDate >= input.endDate) {
      throw new InvalidEventPeriodException(
        '시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    for (const condition of input.conditions) {
      if (
        !SUPPORTED_EVENT_TYPES[condition.category] ||
        !SUPPORTED_EVENT_TYPES[condition.category].includes(condition.type)
      ) {
        throw new UnsupportedEventConditionTypeException(
          condition.category,
          condition.type,
        );
      }
      // TODO: 각 condition.type에 따른 value의 유효성 검사 (예: 숫자여야 하는데 문자열이 오는지 등)
    }

    const newEvent = new Event();
    newEvent.name = input.name;
    newEvent.description = input.description;
    newEvent.startDate = input.startDate;
    newEvent.endDate = input.endDate;
    newEvent.status = input.status || EventStatus.SCHEDULED;
    newEvent.conditions = input.conditions.map((c) => ({
      ...c,
    })) as any;
    newEvent.requiresManualApproval = input.requiresManualApproval || false;
    newEvent.createdBy = new Types.ObjectId(input.createdBy);

    try {
      return await this.eventRepository.save(newEvent);
    } catch (error) {
      throw new DatabaseOperationException(
        '이벤트 생성 중 오류가 발생했습니다.',
      );
    }
  }
}
