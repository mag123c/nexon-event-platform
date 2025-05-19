import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  setupPipe,
  setupSwagger,
} from '@app/common';
import { EventAppModule } from '@app/event/event-app.module';
import { setupCors } from '@app/common/bootstrap/setup-cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(EventAppModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const port = process.env.EVENT_PORT || 6173;

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors();
  setupCors(app);
  setupPipe(app);
  setupSwagger(app, 'Event API', 'event');

  await app.listen(port, () => {
    console.log(`Event API Server is running on: ${port}`);
  });
}
void bootstrap();
