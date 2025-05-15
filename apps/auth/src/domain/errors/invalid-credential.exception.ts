import { HttpStatus } from '@nestjs/common';
import { BaseError } from 'libs/common';

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
