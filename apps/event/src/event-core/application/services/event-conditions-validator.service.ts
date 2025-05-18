import { SUPPORTED_EVENT_TYPES } from '@app/event/event-core/application/config/event-condition.config';
import { EventConditionInput } from '@app/event/event-core/application/use-cases/craete-event/event-condition.input';
import {
  UnsupportedEventConditionTypeException,
  InvalidEventConditionValueException,
} from '@app/event/event-core/domain/errors/event-condition.exception';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventConditionsValidatorService {
  private readonly logger = new Logger(EventConditionsValidatorService.name);

  /**
   * @description
   * 이벤트 조건 배열을 순회하며 각 조건의 유효성을 검사합니다.
   * 1. 이벤트 조건이 최소 1개 이상 존재하는지 확인합니다.
   * 2. 지원하는 카테고리 및 타입 조합인지 확인합니다.
   * 3. 각 조건 타입에 따라 값(value)이 유효한 숫자인지, 그리고 음수가 아닌지 확인합니다.
   * @param condition - 검증할 이벤트 조건 객체 (EventConditionInput)
   * @throws UnsupportedEventConditionTypeException - 지원하지 않는 조건 카테고리 또는 타입일 경우
   * @throws InvalidEventConditionValueException - value가 유효한 숫자가 아닐 경우
   */
  validate(condition: EventConditionInput): void {
    // 지원하는 카테고리 및 타입 조합인지 확인
    const supportedTypesForCategory = SUPPORTED_EVENT_TYPES[condition.category];
    if (
      !supportedTypesForCategory ||
      !supportedTypesForCategory.includes(condition.type)
    ) {
      this.logger.warn(
        `Unsupported event condition: Category='${condition.category}', Type='${condition.type}'`,
      );
      throw new UnsupportedEventConditionTypeException(
        condition.category,
        condition.type,
      );
    }

    // 모든 조건의 value는 숫자여야 하고, 음수가 아니어야함.
    if (
      typeof condition.value !== 'number' ||
      isNaN(condition.value) ||
      condition.value < 0
    ) {
      this.logger.warn(
        `조건 value 검증 실패: 카테고리='${condition.category}', 타입='${condition.type}', 값='${condition.value}'`,
      );
      throw new InvalidEventConditionValueException(
        condition.category,
        condition.type,
        condition.value,
        '값은 0 또는 양의 숫자여야 합니다. (날짜 관련 값은 유효한 타임스탬프여야 합니다)',
      );
    }
  }
}
