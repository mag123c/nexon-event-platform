import { Event } from '../entities/event.entity';

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByName(name: string): Promise<Event | null>;
  save(event: Event): Promise<Event>;
}

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');
