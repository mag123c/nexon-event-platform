import { Event } from '@app/event/event-core/domain/entities/event.entity';

export interface ListEventsUseCaseOutput {
  events: Event[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
