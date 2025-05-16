import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';

export class InvalidEventPeriodException extends BaseError {
  constructor(message: string = 'Invalid event period.') {
    super(HttpStatus.BAD_REQUEST, message, undefined, 'warn');
  }
}
