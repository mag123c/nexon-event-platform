import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupCors = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const allowedOrigins = [configService.get<string>('GATEWAY_SERVICE_URL')];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin ${origin} not allowed for this service.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
};
