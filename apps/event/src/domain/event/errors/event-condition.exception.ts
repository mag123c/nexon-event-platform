import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';
import { EventConditionCategory } from '@app/event/domain/event/value-objects/event-condition-category.vo';

export class EventMustHaveConditionsException extends BaseError {
  constructor(
    message: string = '이벤트에는 최소 하나 이상의 조건이 필요합니다.',
  ) {
    super(HttpStatus.BAD_REQUEST, message, undefined, 'warn');
  }
}

export class InvalidEventConditionValueException extends BaseError {
  constructor(
    category: EventConditionCategory,
    type: string,
    value: number,
    reason: string,
  ) {
    super(
      HttpStatus.BAD_REQUEST,
      `잘못된 이벤트 조건 값입니다. [카테고리: ${category}, 타입: ${type}, 값: ${JSON.stringify(value)}] - 사유: ${reason}`,
      { category, type, value, reason },
      'warn',
    );
  }
}

export class UnsupportedEventConditionTypeException extends BaseError {
  constructor(category: EventConditionCategory, type: string) {
    super(
      HttpStatus.CONFLICT,
      `지원하는 이벤트 조건 타입이 아닙니다. category: ${category}, type: ${type}`,
      undefined,
      'warn',
    );
  }
}
