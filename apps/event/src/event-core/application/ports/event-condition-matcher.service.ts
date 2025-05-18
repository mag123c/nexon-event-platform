import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';

export interface EventConditionMatchDetail {
  conditionDefinition: EventCondition;
  conditionType: string;
  targetValue: any;
  actualValue: any;
  isMet: boolean;
  checkedAt: Date;
  message?: string;
}

export interface EventConditionMatchResult {
  allConditionsMet: boolean;
  checkDetail: EventConditionMatchDetail;
}

export const EVENT_CONDITION_MATCHER_SERVICE = Symbol(
  'EVENT_CONDITION_MATCHER_SERVICE',
);

export interface IEventConditionMatcherService {
  /**
   * 주어진 이벤트 조건들과 유저 활동 데이터를 비교하여 조건 충족 여부를 판단합니다.
   * @param condition - 검증할 EventCondition
   * @param userActivity - 유저의 활동 데이터
   * @returns EventConditionMatchResult 객체
   */
  match(
    condition: EventCondition,
    userActivity: UserActivityData,
  ): EventConditionMatchResult;
}
