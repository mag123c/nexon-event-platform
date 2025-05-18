import { Reward } from '@app/event/reward/domain/entities/reward.entity';

export interface ListRewardsByEventIdUseCaseOutput {
  rewards: Reward[];
}
