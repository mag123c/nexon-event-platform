import { AuthModule } from '@app/auth/auth.module';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  setupPipe,
  setupSwagger,
} from '@app/common';
import { setupCors } from '@app/common/bootstrap/setup-cors';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AuthModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const port = process.env.AUTH_PORT || 5173;

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupCors(app);
  setupPipe(app);
  setupSwagger(app, 'Auth API', 'auth');

  await app.listen(port, () => {
    console.log(`Auth API Server is running on: ${port}`);
  });
}
void bootstrap();
