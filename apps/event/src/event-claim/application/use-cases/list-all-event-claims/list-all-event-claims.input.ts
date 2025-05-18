import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { ClaimStatus } from '@app/event/event-claim/domain/entities/event-claim.entity';

export interface ListAllEventClaimsUseCaseInput extends BasePaginationOptions {
  userId?: string;
  eventId?: string;
  status?: ClaimStatus;
  requestedAtFrom?: Date;
  requestedAtTo?: Date;
}
