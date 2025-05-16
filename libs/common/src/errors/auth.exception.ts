import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';

export class JwtExpiredException extends BaseError {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'JWT가 만료되었습니다.', undefined, 'warn');
  }
}

export class JwtUnauthorizedException extends BaseError {
  constructor(message: string = '인증되지 않은 요청입니다.') {
    super(HttpStatus.UNAUTHORIZED, message, undefined, 'warn');
  }
}

export class ForbiddenRoleException extends BaseError {
  constructor(
    requiredRoles?: string[],
    userRoles?: string[],
    message: string = '권한이 없습니다.',
  ) {
    const extra: Record<string, any> = {};
    if (requiredRoles && requiredRoles.length > 0) {
      extra.requiredRoles = requiredRoles;
    }
    if (userRoles && userRoles.length > 0) {
      extra.userRoles = userRoles;
    }

    super(
      HttpStatus.FORBIDDEN,
      message,
      Object.keys(extra).length > 0 ? extra : undefined,
      'warn',
    );
  }
}
