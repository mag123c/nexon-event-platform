import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseError } from 'libs/common/errors/base.error';
import { isDevelopment } from 'libs/common/utils/env';

interface ErrorResponse {
  result: string;
  message: string;
  path?: string;
  stack?: string;
  body?: any;
}

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof BaseError) {
      return res.status(exception.status).json(exception.toJSON());
    }

    if (exception instanceof HttpException) {
      code = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const json: ErrorResponse = {
      result: 'failed',
      message,
    };

    if (!isDevelopment() && exception instanceof Error) {
      json.path = req.url;
      json.stack = exception.stack;
      json.body = req.body;
    }

    return res.status(code).json(json);
  }
}
