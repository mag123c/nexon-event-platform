import { CreateEventInput } from '@app/event/event-core/application/use-cases/craete-event/craete-event.input';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventFactory } from '@app/event/event-core/domain/factories/event.factory';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class EventMongoFactory implements EventFactory {
  create(input: CreateEventInput, startDate: Date, endDate: Date): Event {
    const newEvent = new Event();
    newEvent.name = input.name;
    newEvent.description = input.description;
    newEvent.startDate = startDate;
    newEvent.endDate = endDate;
    newEvent.status = input.status || EventStatus.SCHEDULED;

    newEvent.conditions = input.conditions.map((cInput) => ({
      category: cInput.category,
      type: cInput.type,
      operator: cInput.operator,
      value: cInput.value,
      unit: cInput.unit,
      description: cInput.description,
    })) as Types.DocumentArray<EventCondition>;

    newEvent.requiresManualApproval = input.requiresManualApproval || false;
    newEvent.createdBy = new Types.ObjectId(input.createdBy);
    return newEvent;
  }
}
