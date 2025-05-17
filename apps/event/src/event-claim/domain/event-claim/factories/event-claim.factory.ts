import { ClaimStatus, EventClaimData } from '../entities/event-claim.entity';
import { GrantedReward as DomainGrantedReward } from '../entities/event-claim.entity';

import { EventConditionMatchDetail } from '@app/event/event-core/application/ports/event-condition-matcher.service';

export interface CreateEventClaimParams {
  userId: string;
  eventId: string;
  status: ClaimStatus;
  // 실제 지급 확정된 보상들
  eligibleRewardsSnapshots: Pick<
    DomainGrantedReward,
    'rewardId' | 'name' | 'type' | 'details'
  >[];
  conditionCheckResults?: EventConditionMatchDetail[];
  failureReason?: string;
  requestedAt?: Date;
  processedAt?: Date;
}

export interface EventClaimFactory {
  create(params: CreateEventClaimParams): EventClaimData;
}

export const EVENT_CLAIM_FACTORY = Symbol('EVENT_CLAIM_FACTORY');
