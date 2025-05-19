import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';
import { CreateRewardRequestDto } from '@app/event/reward/presentation/dtos/request/reward.request.dto';

interface ApiExample {
  summary?: string;
  description?: string;
  value: any;
}

export const createRewardExamples: Record<string, ApiExample> = {
  mileageRewardFixed: {
    summary: '마일리지 보상 (5개 한정)',
    value: {
      name: '선착순 5명! 1000 마일리지!',
      description: '이벤트 달성 선착순 5명에게만 드리는 특별 마일리지입니다.',
      type: RewardType.MILEAGE,
      details: { amount: 1000 },
      quantity: 5,
    } as CreateRewardRequestDto,
  },
  itemRewardUnlimited: {
    summary: '아이템 보상 (수량 무제한) - 블랙큐브',
    value: {
      name: '블랙 큐브 (무제한 지급)',
      description: '이벤트 달성자 모두에게 블랙 큐브를 드립니다.',
      type: RewardType.ITEM,
      details: { itemId: 'BLACK_CUBE_001', itemName: '블랙 큐브', quantity: 1 },
      quantity: null,
    } as CreateRewardRequestDto,
  },
  nexonCashRewardFixed: {
    summary: '넥슨캐시 보상 (5개 한정)',
    value: {
      name: '특별 감사 5000 넥슨캐시 (5명 한정)',
      type: RewardType.NEXON_CASH,
      details: { amount: 5000 },
      quantity: 5,
    } as CreateRewardRequestDto,
  },
};
