import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';

export class EventAlreadyExistsException extends BaseError {
  constructor(eventName: string) {
    super(
      HttpStatus.CONFLICT,
      `Event with name "${eventName}" already exists.`,
      { eventName },
      'warn',
    );
  }
}

export class InvalidEventPeriodException extends BaseError {
  constructor(message: string = 'Invalid event period.') {
    super(HttpStatus.BAD_REQUEST, message, undefined, 'warn');
  }
}
