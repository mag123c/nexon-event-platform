import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';

export class ServiceUnavailableProxyException extends BaseError {
  constructor(serviceName: string, originalError?: Error) {
    const message = `${serviceName} 서비스에 연결할 수 없거나 응답이 없습니다.`;
    const extra = originalError
      ? { originalError: originalError.message }
      : undefined;
    super(HttpStatus.SERVICE_UNAVAILABLE, message, extra, 'error');
  }
}

export class BadGatewayProxyException extends BaseError {
  constructor(serviceName: string, statusCode?: number, responseData?: any) {
    const message = `${serviceName} 서비스에서 오류가 발생했습니다.`;
    const extra: Record<string, any> = {};
    if (statusCode) extra.upstreamStatusCode = statusCode;
    if (responseData) extra.upstreamResponse = responseData;
    super(
      HttpStatus.BAD_GATEWAY,
      message,
      Object.keys(extra).length > 0 ? extra : undefined,
      'error',
    );
  }
}

export class ProxyConfigurationError extends BaseError {
  constructor(
    message: string = '게이트웨이 프록시 설정 또는 로직 오류입니다.',
  ) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, undefined, 'error');
  }
}
