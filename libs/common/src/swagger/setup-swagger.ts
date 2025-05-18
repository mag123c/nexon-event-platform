import type { INestApplication } from '@nestjs/common';
import type { SwaggerCustomOptions } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// swaggerConfig 함수
export const swaggerConfig = (title: string, description?: string) => {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description ?? title)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
        description: 'Access token for authorization',
      },
      'accessToken',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Internal-Api-Key',
        in: 'header',
        description:
          'Gateway internal API Key for server-to-server communication.',
      },
      'x-internal-api-key',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-User-Id',
        in: 'header',
        description:
          'User ID for internal API key authentication. This is used to identify the user making the request.',
      },
      'x-user-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-User-Roles',
        in: 'header',
        description:
          'User roles([]) for internal API key authentication. This is used to identify the roles of the user making the request.',
      },
      'x-user-roles',
    )
    .build();
};

export const setupSwagger = (
  app: INestApplication,
  title: string,
  description?: string,
) => {
  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig(title, description),
    {},
  );

  const swaggerOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      ui: true, // UI
      raw: true, // Docs (JSON/YAML)
    },
  };

  SwaggerModule.setup('/docs', app, document, swaggerOptions);
};
