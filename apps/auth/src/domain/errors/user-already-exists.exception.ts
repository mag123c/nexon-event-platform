import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common';

export class UserAlreadyExistsException extends BaseError {
  constructor(email: string) {
    super(
      HttpStatus.CONFLICT,
      `User with email ${email} already exists.`,
      { email },
      'warn',
    );
  }
}
