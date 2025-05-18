import {
  ConditionCheckResult,
  ConditionCheckResultSchema,
} from '@app/event/event-claim/domain/embedded/condition-checklist.schema';
import {
  GrantedReward,
  GrantedRewardSchema,
} from '@app/event/event-claim/domain/embedded/grant-rewards.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ClaimStatus {
  REQUESTED = 'REQUESTED',
  SUCCESS = 'SUCCESS',
  FAILED_CONDITIONS_NOT_MET = 'FAILED_CONDITIONS_NOT_MET',
  FAILED_NO_REWARDS_AVAILABLE = 'FAILED_NO_REWARDS_AVAILABLE',
  FAILED_ALREADY_CLAIMED = 'FAILED_ALREADY_CLAIMED',
  FAILED_EVENT_NOT_ACTIVE = 'FAILED_EVENT_NOT_ACTIVE',
  FAILED_EVENT_EXPIRED = 'FAILED_EVENT_EXPIRED',
  FAILED_UNKNOWN = 'FAILED_UNKNOWN',
}

@Schema({ collection: 'event_claims', timestamps: true, versionKey: false })
export class EventClaim extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ClaimStatus,
    required: true,
    default: ClaimStatus.REQUESTED,
  })
  status!: ClaimStatus;

  @Prop({ type: [GrantedRewardSchema], default: [] })
  grantedRewards!: GrantedReward[];

  @Prop({ type: [ConditionCheckResultSchema], default: [] })
  conditionCheckDetails?: ConditionCheckResult[]; // 조건 검증 결과

  @Prop()
  failureReason?: string; // 실패 사유 (간단한 문자열)

  @Prop({ default: Date.now })
  requestedAt!: Date; // 유저 요청 시각

  @Prop()
  processedAt?: Date;

  createdAt!: Date;
  updatedAt?: Date;
}

export type EventClaimDocument = EventClaim & Document;
export const EventClaimSchema = SchemaFactory.createForClass(EventClaim);

EventClaimSchema.index({ userId: 1, eventId: 1 });
export { GrantedReward, ConditionCheckResult };
