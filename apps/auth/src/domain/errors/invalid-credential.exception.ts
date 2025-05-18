import { BaseError } from '@app/common/errors/base.error';
import { HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends BaseError {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'Invalid email or password.',
      undefined,
      'warn',
    );
  }
}
