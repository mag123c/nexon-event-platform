import { RewardDetailsUnion } from '@app/event/domain/reward/entities/reward.entity';
import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';

export interface CreateRewardInput {
  eventId: string;
  name: string;
  description?: string;
  type: RewardType;
  details: RewardDetailsUnion;
  quantity?: number | null;
  createdBy: string;
}
