import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';

export class MissingInternalApiKeyException extends BaseError {
  constructor(message: string = '필수 내부 API 키 헤더가 누락되었습니다.') {
    super(HttpStatus.UNAUTHORIZED, message, undefined, 'warn');
  }
}

export class InvalidInternalApiKeyException extends BaseError {
  constructor(message: string = '유효하지 않은 내부 API 키입니다.') {
    super(HttpStatus.UNAUTHORIZED, message, undefined, 'warn');
  }
}

export class MisconfiguredInternalApiAuthException extends BaseError {
  constructor(
    message: string = '내부 API 인증이 잘못 설정되었습니다. 관리자에게 문의하세요.',
  ) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, undefined, 'error');
  }
}
