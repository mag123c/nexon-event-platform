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

export class EventNotFoundException extends BaseError {
  constructor(eventId: string) {
    super(
      HttpStatus.NOT_FOUND,
      `Event with ID "${eventId}" not found.`,
      { eventId },
      'warn',
    );
  }
}

export class EventNotActiveException extends BaseError {
  constructor(eventId: string, status: string) {
    super(
      HttpStatus.BAD_REQUEST,
      `Event with ID "${eventId}" is not active. Current status: ${status}`,
      { eventId, status },
      'warn',
    );
  }
}
