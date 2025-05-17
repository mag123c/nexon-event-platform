import { EventClaim, EventClaimData } from '../entities/event-claim.entity';
import { ClientSession, Types } from 'mongoose';

export interface EventClaimRepository {
  findById(id: string | Types.ObjectId): Promise<EventClaim | null>;
  findSuccessfulClaim(
    userId: string | Types.ObjectId,
    eventId: string | Types.ObjectId,
  ): Promise<EventClaim | null>;
  save(eventClaim: EventClaimData): Promise<EventClaim>;
  saveInSession(
    eventClaim: EventClaimData,
    session: ClientSession,
  ): Promise<EventClaim>;
}

export const EVENT_CLAIM_REPOSITORY = Symbol('EVENT_CLAIM_REPOSITORY');
