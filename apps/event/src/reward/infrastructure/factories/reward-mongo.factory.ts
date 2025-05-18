import { CreateRewardInput } from '@app/event/reward/application/use-cases/create-reward/create-reward.input';
import { Reward } from '@app/event/reward/domain/entities/reward.entity';
import { RewardFactory } from '@app/event/reward/domain/factories/reward.factory';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class RewardMongoFactory implements RewardFactory {
  create(input: CreateRewardInput, eventObjectId: Types.ObjectId): Reward {
    const newReward = new Reward();

    newReward.eventId = eventObjectId;
    newReward.name = input.name;
    newReward.description = input.description;
    newReward.type = input.type;
    newReward.details = input.details;
    newReward.quantity = input.quantity === undefined ? null : input.quantity;
    newReward.remainingQuantity = newReward.quantity ?? undefined;
    newReward.createdBy = new Types.ObjectId(input.createdBy);

    return newReward;
  }
}
