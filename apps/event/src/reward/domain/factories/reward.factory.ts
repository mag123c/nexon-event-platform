import { CreateRewardInput } from '@app/event/reward/application/use-cases/create-reward/create-reward.input';
import { Reward } from '@app/event/reward/domain/entities/reward.entity';
import { Types } from 'mongoose';

export const REWARD_FACTORY = Symbol('REWARD_FACTORY');

export interface RewardFactory {
  create(input: CreateRewardInput, eventObjectId: Types.ObjectId): Reward;
}
