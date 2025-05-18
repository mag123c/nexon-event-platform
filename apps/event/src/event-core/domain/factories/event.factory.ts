import { CreateEventInput } from '@app/event/event-core/application/use-cases/craete-event/craete-event.input';
import { Event } from '@app/event/event-core/domain/entities/event.entity';

export const EVENT_FACTORY = Symbol('EVENT_FACTORY');

export interface EventFactory {
  create(input: CreateEventInput, startDate: Date, endDate: Date): Event;
}
