import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseError } from '@app/common/errors/base.error';

interface ErrorResponse {
  code: number;
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
    const req = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';
    let errorName = 'InternalServerError';
    let responseBody: Record<string, any>;

    if (exception instanceof BaseError) {
      responseBody = exception.toJSON();
      statusCode = exception.statusCode;
      errorName = exception.constructor.name;
      responseBody.statusCode = responseBody.statusCode ?? statusCode;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();
      errorName = exception.constructor.name;

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        message = (exResponse as any).message || exception.message;
        errorName = (exResponse as any).error || errorName;
      }

      responseBody = {
        statusCode,
        message,
        error: errorName,
      };
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.constructor.name;

      responseBody = {
        statusCode,
        message,
        error: errorName,
      };
    } else {
      responseBody = {
        statusCode,
        message: 'An unexpected internal error occurred.',
        error: 'UnknownError',
      };
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      !(exception instanceof BaseError)
    ) {
      responseBody.path = req.url;
      if (exception instanceof Error) responseBody.stack = exception.stack;
      if (Object.keys(req.body).length > 0) responseBody.body = req.body;
    }

    if (!responseBody.result && statusCode >= 400) {
      responseBody.result = 'failed';
    }

    return res.status(statusCode).json(responseBody);
  }
}
