import { EventClaimData } from '@app/event/event-claim/domain/interfaces/event-claim-data.interface';

export interface ListMyEventClaimsUseCaseOutput {
  claims: EventClaimData[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
