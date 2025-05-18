import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  Reward,
  RewardDocument,
} from '@app/event/reward/domain/entities/reward.entity';
import { RewardRepository } from '@app/event/reward/domain/ports/reward.repository';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';

@Injectable()
export class RewardMongoRepository implements RewardRepository {
  private readonly logger = new Logger(RewardMongoRepository.name);

  constructor(
    @InjectModel(Reward.name, MONGO_CONNECTIONS.EVENT)
    private readonly rewardModel: Model<RewardDocument>,
  ) {}

  async findById(id: Types.ObjectId | string): Promise<Reward | null> {
    return this.rewardModel.findById(id).exec();
  }

  async findByEventIdAndName(
    eventId: string,
    name: string,
  ): Promise<Reward | null> {
    return this.rewardModel.findOne({ eventId, name }).exec();
  }

  async findByEventId(eventId: string): Promise<Reward[]> {
    return this.rewardModel.find({ eventId }).exec();
  }

  async save(reward: Reward): Promise<Reward> {
    const newReward = new this.rewardModel(reward);
    return newReward.save();
  }

  async decreaseQuantity(
    rewardId: string | Types.ObjectId,
    amountToDecrease: number, // 일반적으로 1
    session?: ClientSession,
  ): Promise<Reward | null> {
    if (amountToDecrease <= 0) {
      this.logger.warn(
        `[decreaseQuantity] 보상 수량 차감 요청이 0 이하입니다. rewardId: ${rewardId}, amountToDecrease: ${amountToDecrease}`,
      );
      return null;
    }

    this.logger.debug(
      `[decreaseQuantity] 보상 수량 차감 요청. rewardId: ${rewardId}, amountToDecrease: ${amountToDecrease}`,
    );

    try {
      // remainingQuantity가 null이 아니고 (한정 수량), 현재 수량이 차감할 양 이상인 경우에만 업데이트.
      const updatedReward = await this.rewardModel
        .findOneAndUpdate(
          {
            _id: rewardId,
            remainingQuantity: { $ne: null, $gte: amountToDecrease }, // null이 아니고, 재고가 충분한 경우
          },
          {
            $inc: { remainingQuantity: -amountToDecrease }, // 원자적으로 차감
          },
          {
            new: true,
            session: session, // 트랜잭션 세션 적용
            runValidators: true,
          },
        )
        .exec();

      if (updatedReward) {
        this.logger.log(
          `[decreaseQuantity] Successfully decreased quantity for rewardId: ${rewardId}. New remainingQuantity: ${updatedReward.remainingQuantity}`,
        );
        return updatedReward; // 성공적으로 차감 및 업데이트된 보상 반환
      } else {
        // updatedReward가 null인 경우:
        //  - 해당 rewardId의 보상이 존재하지 않음.
        //  - 보상이 존재하지만, remainingQuantity가 null (무제한)이어서 조건에 맞지 않음.
        //  - 보상이 존재하고 remainingQuantity가 숫자로 한정되어 있지만, 재고가 amountToDecrease보다 부족함.

        // 어떤 이유로 실패했는지 확인하기 위해 보상을 다시 조회 (로깅 및 디버깅 목적)
        const currentRewardState = await this.rewardModel
          .findById(rewardId)
          .session(session || null)
          .lean()
          .exec();
        if (!currentRewardState) {
          this.logger.warn(
            `[decreaseQuantity] 보상이 존재하지 않음. rewardId: ${rewardId}.`,
          );
        } else if (currentRewardState.remainingQuantity === null) {
          this.logger.warn(
            `[decreaseQuantity] 보상이 무제한입니다. rewardId: ${rewardId}. remainingQuantity: null`,
          );
          // 이 경우, 유스케이스에서 이미 무제한으로 처리했어야 함.
          // 이 메소드는 한정 수량 차감에 집중하므로, 이 상황에서 updatedReward가 null인 것은 정상.
        } else {
          this.logger.warn(
            `[decreaseQuantity] 보상 재고 감소에 실패했습니다. rewardId: ${rewardId}. remainingQuantity: ${currentRewardState.remainingQuantity}. amountToDecrease: ${amountToDecrease}`,
          );
        }
        return null; // 차감 실패 (위의 이유들 중 하나)
      }
    } catch (error: any) {
      this.logger.error(
        `[decreaseQuantity] 보상 감소 중 오류 발생. rewardId: ${rewardId}.`,
        error.stack,
      );
      throw new DatabaseOperationException(
        `보상 [${rewardId}]의 수량 차감 중 데이터베이스 오류 발생`,
        error,
      );
    }
  }
}
