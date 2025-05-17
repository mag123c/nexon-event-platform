import { RewardDetailsUnion } from '@app/event/domain/reward/entities/reward.entity';
import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// 지급된 보상
@Schema({ _id: false, versionKey: false, timestamps: false })
export class GrantedReward {
  @Prop({ type: Types.ObjectId, ref: 'Reward', required: true })
  rewardId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: String, enum: RewardType, required: true })
  type!: RewardType;

  @Prop({ type: Object, required: true })
  details!: RewardDetailsUnion;
}
export const GrantedRewardSchema = SchemaFactory.createForClass(GrantedReward);
