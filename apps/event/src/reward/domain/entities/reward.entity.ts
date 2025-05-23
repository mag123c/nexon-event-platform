import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { RewardType } from '../value-objects/reward-type.vo';

export interface MileageRewardDetails {
  amount: number;
}

export interface ItemRewardDetails {
  itemId: string;
  quantity: number;
}

export interface NexonCashRewardDetails {
  amount: number;
}

export type RewardDetailsUnion =
  | MileageRewardDetails
  | ItemRewardDetails
  | NexonCashRewardDetails
  | Record<string, any>;

export type RewardDocument = Reward & Document;

@Schema({
  timestamps: true,
  collection: 'rewards',
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class Reward {
  _id!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  eventId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    type: String,
    enum: RewardType,
    index: true,
  })
  type!: RewardType;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  details!: RewardDetailsUnion;

  // 최초 세팅한 수량
  @Prop({ type: Number, default: null })
  quantity?: number | null;

  // 남은 수량
  @Prop({ type: Number })
  remainingQuantity?: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  updatedBy?: Types.ObjectId;

  createdAt!: Date;
  updatedAt?: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

RewardSchema.index({ eventId: 1, type: 1 });
