import {
  ClaimStatus,
  EventClaim,
} from '@app/event/event-claim/domain/entities/event-claim.entity';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';
import { Types } from 'mongoose';

interface CreateEventClaimFixtureOptions {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  status?: ClaimStatus;
  requestedAt?: Date;
  processedAt?: Date;
  failureReason?: string;
  grantedRewardsCount?: number;
  conditionDetail?: Partial<EventCondition>;
}

export const createEventClaimFixture = (
  options: CreateEventClaimFixtureOptions,
): Partial<EventClaim> => {
  const now = new Date();
  const id = options._id || new Types.ObjectId();

  const grantedRewards = [];
  if (
    options.status === ClaimStatus.SUCCESS &&
    (options.grantedRewardsCount || 0) > 0
  ) {
    for (let i = 0; i < (options.grantedRewardsCount || 1); i++) {
      grantedRewards.push({
        rewardId: new Types.ObjectId(),
        name: `지급된 테스트 보상 ${i + 1} for Event ${options.eventId.toHexString().substring(0, 5)}`,
        type: RewardType.MILEAGE,
        details: { amount: Math.floor(Math.random() * 500) + 100 },
      });
    }
  }

  let conditionCheckDetailForFixture: any = undefined;
  if (
    options.status === ClaimStatus.FAILED_CONDITIONS_NOT_MET &&
    options.conditionDetail
  ) {
    conditionCheckDetailForFixture = {
      conditionType: `${options.conditionDetail.category}_${options.conditionDetail.type}`,
      targetValue: options.conditionDetail.value,
      actualValue:
        options.conditionDetail.value !== undefined
          ? Math.max(0, options.conditionDetail.value - 1)
          : undefined,
      isMet: false,
      checkedAt: options.requestedAt || now,
      message: options.conditionDetail.description || '조건 미충족 (Fixture)',
    };
  }

  return {
    _id: id,
    userId: options.userId,
    eventId: options.eventId,
    status: options.status || ClaimStatus.REQUESTED,
    requestedAt:
      options.requestedAt ||
      new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
    processedAt:
      options.status && options.status !== ClaimStatus.REQUESTED
        ? new Date(
            (options.requestedAt || now).getTime() +
              Math.random() * 60000 +
              1000,
          ) // 요청 1~60초 후 처리
        : undefined,
    grantedRewards: grantedRewards,
    failureReason: options.failureReason,
    conditionCheckDetail: conditionCheckDetailForFixture,
  };
};
