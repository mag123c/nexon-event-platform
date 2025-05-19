import {
  HttpExceptionFilter,
  LoggingInterceptor,
  setupPipe,
} from '@app/common';
import { AppModule } from '@app/gateway/app.module';
import { setupGatewayIntegratedSwagger } from '@app/gateway/config/gateway-swagger.config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('GATEWAY_PORT') || 4173;

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  setupPipe(app);
  setupGatewayIntegratedSwagger(app, configService);

  await app.listen(port, () => {
    console.log(`Gateway API Server is running on: ${port}`);
  });
}
bootstrap();
