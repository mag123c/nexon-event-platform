import { AuthModule } from '@app/auth/auth.module';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  setupPipe,
  setupSwagger,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AuthModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const port = process.env.PORT || 5555;

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupPipe(app);
  setupSwagger(app, 'Auth API Server', 'auth');

  await app.listen(port, () => {
    console.log(`Auth API Server is running on: ${port}`);
  });
}
void bootstrap();
