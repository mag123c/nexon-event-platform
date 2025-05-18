import { BaseError } from '@app/common/errors/base.error';
import { HttpStatus } from '@nestjs/common';

export class HashingException extends BaseError {
  constructor(
    message: string = 'Password hashing operation failed.',
    cause?: Error,
  ) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      cause ? { originalError: cause.message, stack: cause.stack } : undefined,
      'error',
    );
    if (cause) {
      this.cause = cause;
    }
  }
}
