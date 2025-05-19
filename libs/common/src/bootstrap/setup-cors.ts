import { isProduction } from '@app/common/utils/env';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupCors = (app: INestApplication) => {
  const configService = app.get(ConfigService);

  const allowedOrigins = [
    'http://localhost:4173',
    `http://${configService.get<string>('GATEWAY_HOSTNAME') ?? 'gateway_app_dev'}:${configService.get<string>('GATEWAY_PORT') ?? 4173}`,
    `http://${configService.get<string>('AUTH_HOSTNAME') ?? 'auth_app_dev'}:${configService.get<string>('AUTH_PORT') ?? 5173}`,
  ];

  if (!isProduction()) {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] ❌ Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
};
