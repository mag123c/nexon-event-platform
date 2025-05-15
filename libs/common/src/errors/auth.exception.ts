import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';

export class JwtExpiredException extends BaseError {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'JWT가 만료되었습니다.');
  }
}

export class JwtUnauthorizedException extends BaseError {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, '인증되지 않은 요청입니다.');
  }
}
