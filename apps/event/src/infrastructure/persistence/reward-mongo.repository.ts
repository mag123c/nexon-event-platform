import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  Reward,
  RewardDocument,
} from '@app/event/domain/reward/entities/reward.entity';
import { RewardRepository } from '@app/event/domain/reward/ports/reward.repository';

@Injectable()
export class RewardMongoRepository implements RewardRepository {
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

  async save(reward: Reward): Promise<Reward> {
    const newReward = new this.rewardModel(reward);
    return newReward.save();
  }
}
