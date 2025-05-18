import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';
import {
  IEventConditionMatcherService,
  EventConditionMatchResult,
} from '@app/event/event-core/application/ports/event-condition-matcher.service';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventConditionMatcherService
  implements IEventConditionMatcherService
{
  private readonly logger = new Logger(EventConditionMatcherService.name);

  /**
   * 주어진 이벤트 조건들과 유저 활동 데이터를 비교하여 조건 충족 여부를 판단합니다.
   * @param condition
   * @param userActivity - 없을 수도 있음.
   * @returns EventConditionMatchResult
   */
  match(
    condition: EventCondition,
    userActivity: UserActivityData | null,
  ): EventConditionMatchResult {
    let allConditionsMet = true;

    // 유저 활동 데이터가 전혀 없는 경우, 조건이 있다면 대부분 미충족으로 처리될 수 있음.
    const safeUserActivity = userActivity || {};
    let actualValue: any;
    let isMet = false;
    const checkedAt = new Date();
    let message: string | undefined;

    try {
      actualValue = this.getActualValue(condition, safeUserActivity);
    } catch (e: any) {
      this.logger.warn(
        `Failed to get actual value for condition type ${condition.type}: ${e.message}`,
      );
      actualValue = undefined;
      message = e.message || '조건에 필요한 유저 활동 값을 가져올 수 없습니다.';
    }

    if (actualValue !== undefined) {
      const targetValue = condition.value;
      try {
        isMet = this.compareValues(
          actualValue,
          targetValue,
          condition.operator,
        );
      } catch (e: any) {
        this.logger.warn(
          `Failed to compare values for operator ${condition.operator}: ${e.message}`,
        );
        message = message || e.message || '조건 값을 비교할 수 없습니다.';
        isMet = false;
      }
    } else {
      isMet = false; // 실제 값을 가져올 수 없었다면 조건 미충족
      if (!message)
        message = '조건 검증에 필요한 유저 활동 데이터를 찾을 수 없습니다.';
    }

    if (!isMet) {
      allConditionsMet = false;
      if (!message) {
        message = `목표: ${this.operatorToString(condition.operator)} ${condition.value}, 실제: ${actualValue}`;
      }
    }

    const checkDetail = {
      conditionDefinition: condition,
      conditionType: `${condition.category}_${condition.type}`,
      targetValue: condition.value,
      actualValue: actualValue,
      isMet: isMet,
      checkedAt: checkedAt,
      message: message,
    };

    return { allConditionsMet, checkDetail };
  }

  private getActualValue(
    condition: EventCondition,
    userActivity: UserActivityData,
  ): any {
    switch (condition.category) {
      // 활동정보
      case EventConditionCategory.USER_ACTIVITY:
        switch (condition.type) {
          case 'LOGIN_STREAK_DAYS':
            return userActivity.loginStreakDays ?? 0;
          case 'INVITED_FRIENDS_COUNT':
            return userActivity.invitedFriendIds?.length ?? 0;
          case 'LAST_LOGIN':
            return userActivity.lastLoginAt ?? new Date(0);
          default:
            throw new Error(
              `지원하지 않는 USER_ACTIVITY 조건 타입: ${condition.type}`,
            );
        }
      // 프로필정보
      case EventConditionCategory.USER_PROFILE:
        switch (condition.type) {
          case 'JOIN_DATE':
            return userActivity.joinedAt ?? new Date(0);
          default:
            throw new Error(
              `지원하지 않는 USER_PROFILE 조건 타입: ${condition.type}`,
            );
        }
      default:
        throw new Error(`지원하지 않는 조건 카테고리: ${condition.category}`);
    }
  }

  private compareValues(
    actual: any,
    target: any,
    operator: EventConditionOperator,
  ): boolean {
    switch (operator) {
      case EventConditionOperator.GREATER_THAN_OR_EQUAL:
        return actual >= target;
      case EventConditionOperator.EQUALS:
        return actual === target;
      case EventConditionOperator.GREATER_THAN:
        return actual > target;
      case EventConditionOperator.LESS_THAN:
        return actual < target;
      case EventConditionOperator.LESS_THAN_OR_EQUAL:
        return actual <= target;
      case EventConditionOperator.NOT_EQUALS:
        return actual !== target;
      default:
        throw new Error(`지원하지 않는 연산자: ${operator}`);
    }
  }

  private operatorToString(operator: EventConditionOperator): string {
    switch (operator) {
      case EventConditionOperator.GREATER_THAN_OR_EQUAL:
        return '>=';
      case EventConditionOperator.EQUALS:
        return '==';
      case EventConditionOperator.LESS_THAN_OR_EQUAL:
        return '<=';
      default:
        return operator.toString();
    }
  }
}
