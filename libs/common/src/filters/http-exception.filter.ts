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
    let error = 'Internal Server Error';

    if (exception instanceof BaseError) {
      statusCode = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message;
        error = (response as any).error ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const json = {
      statusCode,
      message,
      error,
    };

    if (process.env.NODE_ENV !== 'production') {
      Object.assign(json, {
        path: req.url,
        stack: (exception as Error).stack,
        body: req.body,
      });
    }

    return res.status(statusCode).json(json);
  }
}
