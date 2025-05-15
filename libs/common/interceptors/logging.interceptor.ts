import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();
    const { method, url } = request;
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        const duration = `${Date.now() - startTime}ms`;
        const baseMessage =
          `${method} ${url} ${duration}` + (user ? `User: ${user.id}` : '');
        this.logger.log(`${baseMessage}`, 'Request');
      }),
      catchError((error) => {
        const duration = `${Date.now() - startTime}ms`;
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;
        const stack =
          error instanceof Error ? error.stack : 'No stack trace available';
        const userId = request.user?.id ?? 'anonymous';
        const userCtx = `User: ${userId}`;

        const message = `[${statusCode}] ${method} ${url} ${duration} ${error instanceof Error ? error.message : 'Unknown error'}`;

        this.logger.error(message, stack, userCtx);

        return throwError(() => error as Error);
      }),
    );
  }
}
