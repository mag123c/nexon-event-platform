import { CreateRewardInput } from '@app/event/application/use-cases/create-reward/create-reward.input';
import {
  MileageRewardDetails,
  ItemRewardDetails,
  NexonCashRewardDetails,
} from '@app/event/domain/reward/entities/reward.entity';
import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';
import { Types } from 'mongoose';

const defaultEventId = new Types.ObjectId().toHexString();
const defaultCreatedById = new Types.ObjectId().toHexString();

export const mileageRewardInputFixture: CreateRewardInput = {
  eventId: defaultEventId,
  name: '출석 1일차 마일리지',
  description: '매일 출석하면 드리는 기본 마일리지입니다.',
  type: RewardType.MILEAGE,
  details: { amount: 100 } as MileageRewardDetails,
  quantity: null, // 무제한
  createdBy: defaultCreatedById,
};

export const itemRewardInputFixture: CreateRewardInput = {
  eventId: defaultEventId,
  name: '레벨업 축하 아이템 상자',
  description: '특정 레벨 달성 시 지급되는 아이템 상자입니다.',
  type: RewardType.ITEM,
  details: {
    itemId: 'RARE_BOX_001',
    itemName: '희귀한 상자',
    quantity: 1,
  } as ItemRewardDetails,
  quantity: 100,
  createdBy: defaultCreatedById,
};

export const nexonCashRewardInputFixture: CreateRewardInput = {
  eventId: defaultEventId,
  name: '이벤트 참여 감사 넥슨캐시',
  type: RewardType.NEXON_CASH,
  details: { amount: 500 } as NexonCashRewardDetails,
  quantity: 1000,
  createdBy: defaultCreatedById,
};

// 유효하지 않은 Details Fixture (타입과 내용 불일치)
export const invalidDetailsItemRewardInputFixture: CreateRewardInput = {
  ...itemRewardInputFixture,
  details: { amount: 999 },
};

// 유효하지 않은 수량 Fixture
export const invalidQuantityRewardInputFixture: CreateRewardInput = {
  ...mileageRewardInputFixture,
  quantity: -5,
};
