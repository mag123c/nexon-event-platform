import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import {
  CreateEventRequestDto,
  EventConditionDto,
} from '@app/event/event-core/presentation/dtos/request/event.request.dto';

interface ApiExample {
  summary?: string;
  description?: string;
  value: any;
}

export const createEventExamples: Record<string, ApiExample> = {
  loginStreakEvent: {
    summary: '연속 로그인 출석 이벤트',
    value: {
      name: '매일매일 연속 출석 이벤트!',
      description: '연속으로 로그인하고 푸짐한 보상을 받아가세요!',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: EventStatus.ACTIVE,
      condition: {
        category: EventConditionCategory.USER_ACTIVITY,
        type: 'LOGIN_STREAK_DAYS',
        operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 7,
        unit: '일',
        description: '7일 이상 연속 로그인',
      } as EventConditionDto,
      requiresManualApproval: false,
    } as CreateEventRequestDto,
  },
  invitedFriendsEvent: {
    summary: '친구 초대 이벤트 (100명 목표)',
    value: {
      name: '친구야, 같이하자! 100명 초대 챌린지!',
      description: '친구를 100명 이상 초대하면 엄청난 보상이!',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: EventStatus.ACTIVE,
      condition: {
        category: EventConditionCategory.USER_ACTIVITY,
        type: 'INVITED_FRIENDS_COUNT',
        operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 10,
        unit: '명',
        description: '친구 100명 이상 초대',
      } as EventConditionDto,
      requiresManualApproval: true,
    } as CreateEventRequestDto,
  },
};
