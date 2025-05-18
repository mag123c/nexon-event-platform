import { CreateEventInput } from '@app/event/event-core/application/use-cases/craete-event/craete-event.input';
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
    newEvent.condition = input.condition;

    newEvent.requiresManualApproval = input.requiresManualApproval || false;
    newEvent.createdBy = new Types.ObjectId(input.createdBy);
    return newEvent;
  }
}
