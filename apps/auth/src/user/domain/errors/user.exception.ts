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

export class UserNotFoundException extends BaseError {
  constructor(identifier?: string) {
    const message = identifier
      ? `User with identifier ${identifier} not found.`
      : 'User not found.';
    super(
      HttpStatus.NOT_FOUND,
      message,
      identifier ? { identifier } : undefined,
      'warn',
    );
  }
}
