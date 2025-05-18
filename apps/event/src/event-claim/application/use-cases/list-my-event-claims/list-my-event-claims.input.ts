import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { ClaimStatus } from '@app/event/event-claim/domain/entities/event-claim.entity';

export interface ListMyEventClaimsUseCaseInput extends BasePaginationOptions {
  requestingUserId: string;
  eventId?: string;
  status?: ClaimStatus;
  requestedAtFrom?: Date;
  requestedAtTo?: Date;
}
