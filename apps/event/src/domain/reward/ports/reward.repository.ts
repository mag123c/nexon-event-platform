import { Reward } from '../entities/reward.entity';

export interface RewardRepository {
  findById(id: string): Promise<Reward | null>;
  findByEventIdAndName(eventId: string, name: string): Promise<Reward | null>;
  save(reward: Reward): Promise<Reward>;
}

export const REWARD_REPOSITORY = Symbol('REWARD_REPOSITORY');
