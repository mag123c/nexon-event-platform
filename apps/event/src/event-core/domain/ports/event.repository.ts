import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';

export interface ListEventsCriteria {
  name?: string;
  status?: EventStatus;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByName(name: string): Promise<Event | null>;
  findAllWithPagination(
    criteria: ListEventsCriteria,
    pagination: BasePaginationOptions,
  ): Promise<[Event[], number]>;
  save(event: Event): Promise<Event>;
}

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');
