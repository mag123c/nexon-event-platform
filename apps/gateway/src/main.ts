import {
  HttpExceptionFilter,
  LoggingInterceptor,
  setupPipe,
  setupSwagger,
} from '@app/common';
import { AppModule } from '@app/gateway/app.module';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const port = process.env.GATEWAY_PORT || 4173;

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupPipe(app);
  setupSwagger(app, 'Gateway API Server', 'gateway');

  await app.listen(port, () => {
    console.log(`Gateway API Server is running on: ${port}`);
  });
}
bootstrap();
