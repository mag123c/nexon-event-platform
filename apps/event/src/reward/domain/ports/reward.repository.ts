import { ClientSession } from 'mongoose';
import { Reward } from '../entities/reward.entity';

export interface RewardRepository {
  findById(id: string): Promise<Reward | null>;
  findByEventIdAndName(eventId: string, name: string): Promise<Reward | null>;
  findByEventId(eventId: string): Promise<Reward[]>;
  save(reward: Reward): Promise<Reward>;

  /**
   * 재고를 감소시킵니다.
   * @param rewardId - 감소시킬 리워드의 ID
   * @param amountToDecrease - 감소시킬 수량
   * @param session - 트랜잭션 세션 (선택적)
   * @returns 업데이트된 리워드 객체 또는 null (재고 부족 등으로 인해 업데이트 실패 시)
   */
  decreaseQuantity(
    rewardId: string,
    amountToDecrease: number,
    session?: ClientSession,
  ): Promise<Reward | null>;
}

export const REWARD_REPOSITORY = Symbol('REWARD_REPOSITORY');
