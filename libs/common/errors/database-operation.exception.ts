import { HttpStatus } from '@nestjs/common';
import { BaseError } from 'libs/common/errors/base.error';

export class DatabaseOperationException extends BaseError {
  constructor(message: string = 'A database operation failed.', cause?: Error) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      cause
        ? { originalErrorName: cause.name, originalErrorMessage: cause.message }
        : undefined,
      'error',
    );
  }
}
