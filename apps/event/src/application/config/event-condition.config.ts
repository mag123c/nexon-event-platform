import { EventConditionCategory } from '@app/event/domain/event/value-objects/event-condition-category.vo';

/**
 * @description
 *  어떤 이벤트들을 지원하는지 나타내는 상수
 *  `이벤트` 애플리케이션의 지원 가능한 이벤트의 세부 조건을 정의하는 데 사용
 */
export const SUPPORTED_EVENT_TYPES: Record<EventConditionCategory, string[]> = {
  [EventConditionCategory.USER_ACTIVITY]: [
    'LOGIN_COUNT', // 로그인 횟수
    'CONSECUTIVE_LOGIN_DAYS', // 연속 로그인 일수
    'INVITED_FRIENDS_COUNT', // 친구 초대 수
  ],
  [EventConditionCategory.PURCHASE_HISTORY]: [
    'TOTAL_SPENT_AMOUNT', // 총 지출 금액
    'PURCHASE_COUNT', // 구매 횟수
  ],
  [EventConditionCategory.USER_PROFILE]: [
    'JOIN_DATE', // 가입일
    'LEVEL', // 레벨
  ],
};
