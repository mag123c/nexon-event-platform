import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import {
  ClaimStatus,
  EventClaim,
} from '@app/event/event-claim/domain/entities/event-claim.entity';
import { EventClaimData } from '@app/event/event-claim/domain/interfaces/event-claim-data.interface';
import { ClientSession, Types } from 'mongoose';

export interface ListEventClaimsCriteria {
  userId?: string | Types.ObjectId;
  eventId?: string | Types.ObjectId;
  status?: ClaimStatus;
  requestedAtFrom?: Date;
  requestedAtTo?: Date;
}

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
  findAllWithPagination(
    criteria: ListEventClaimsCriteria,
    pagination: BasePaginationOptions,
  ): Promise<[EventClaimData[], number]>;
}

export const EVENT_CLAIM_REPOSITORY = Symbol('EVENT_CLAIM_REPOSITORY');
