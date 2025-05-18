import { RewardDetailsUnion } from '@app/event/reward/domain/entities/reward.entity';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';

export interface CreateRewardInput {
  eventId: string;
  name: string;
  description?: string;
  type: RewardType;
  details: RewardDetailsUnion;
  quantity?: number | null;
  createdBy: string;
}
