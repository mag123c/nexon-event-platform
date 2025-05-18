import { Types } from 'mongoose';
import { ClaimStatus } from '../entities/event-claim.entity';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import { RewardDetailsUnion } from '@app/event/reward/domain/entities/reward.entity';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';

export interface GrantedRewardData {
  rewardId: Types.ObjectId | string;
  name: string;
  type: RewardType;
  details: RewardDetailsUnion;
}

export interface ConditionCheckResultData {
  conditionDefinition?: EventCondition;
  conditionType: string;
  targetValue: any;
  actualValue: any;
  isMet: boolean;
  checkedAt: Date;
  message?: string;
}

export interface EventClaimData {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  eventId: Types.ObjectId | string;
  status: ClaimStatus;
  grantedRewards: GrantedRewardData[];
  conditionCheckDetail?: ConditionCheckResultData;
  failureReason?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  id?: string;
}
