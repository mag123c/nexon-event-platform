import { isDevelopment, isTest } from '@app/common/utils/env';
import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

export const setupPipe = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      disableErrorMessages: isDevelopment(),
      skipMissingProperties: false,
      exceptionFactory: (errors) => {
        if (!isDevelopment() && !isTest()) {
          console.error(errors);
        }
        return new BadRequestException(
          isDevelopment()
            ? 'Invalid request parameters'
            : errors.map((err) => ({
                property: err.property,
                constraints: err.constraints,
              })),
        );
      },
    }),
  );
};
