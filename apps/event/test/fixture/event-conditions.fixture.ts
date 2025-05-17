import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { SUPPORTED_EVENT_TYPES } from '@app/event/event-core/application/config/event-condition.config';
import { EventConditionInput } from '@app/event/event-core/application/use-cases/craete-event/event-condition.input';

// 1. 로그인 N회 이상
export const loginCountConditionFixture: EventConditionInput = {
  category: EventConditionCategory.USER_ACTIVITY,
  type: SUPPORTED_EVENT_TYPES[EventConditionCategory.USER_ACTIVITY].find(
    (t) => t === 'LOGIN_COUNT',
  )!,
  operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
  value: 5,
  unit: 'times',
  description: '최근 일주일간 5회 이상 로그인',
};

// 2. 친구 초대 N명 이상
export const friendInvitationConditionFixture: EventConditionInput = {
  category: EventConditionCategory.USER_ACTIVITY,
  type: SUPPORTED_EVENT_TYPES[EventConditionCategory.USER_ACTIVITY].find(
    (t) => t === 'INVITED_FRIENDS_COUNT',
  )!,
  operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
  value: 3,
  unit: 'people',
  description: '친구 3명 이상 초대 완료',
};

// 3. 신규 유저 (가입일 기준)
export const newUserJoinDateConditionFixture: EventConditionInput = {
  category: EventConditionCategory.USER_PROFILE,
  type: SUPPORTED_EVENT_TYPES[EventConditionCategory.USER_PROFILE].find(
    (t) => t === 'JOIN_DATE',
  )!,
  operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
  value: 7,
  description: '가입 후 7일 이내 신규 유저',
};

// 4. 복귀 유저 (마지막 접속일 기준)
export const returningUserLastLoginConditionFixture: EventConditionInput = {
  category: EventConditionCategory.USER_ACTIVITY,
  type: 'LAST_LOGIN_AT',
  operator: EventConditionOperator.LESS_THAN_OR_EQUAL,
  value: 30,
  description: '마지막 접속 후 30일 이상 경과한 복귀 유저',
};

// 다양한 조건 조합 Fixture
export const combinedConditionsFixture: EventConditionInput[] = [
  loginCountConditionFixture,
  friendInvitationConditionFixture,
];

// 유효하지 않은 조건 Fixture (단위 테스트용)
export const invalidCategoryConditionFixture: EventConditionInput = {
  category: 'INVALID_CATEGORY' as EventConditionCategory,
  type: 'ANY_TYPE',
  operator: EventConditionOperator.EQUALS,
  value: 1,
};

export const invalidTypeConditionFixture: EventConditionInput = {
  category: EventConditionCategory.USER_ACTIVITY,
  type: 'INVALID_TYPE_FOR_USER_ACTIVITY',
  operator: EventConditionOperator.EQUALS,
  value: 1,
};
