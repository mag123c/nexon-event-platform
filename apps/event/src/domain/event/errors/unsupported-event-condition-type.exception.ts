import { BaseError } from '@app/common';
import { EventConditionCategory } from '@app/event/domain/event/value-objects/event-condition-category.vo';
import { HttpStatus } from '@nestjs/common';

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
