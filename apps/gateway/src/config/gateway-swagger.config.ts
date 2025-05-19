import type { INestApplication } from '@nestjs/common';
import type { SwaggerCustomOptions } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * 게이트웨이용 통합 Swagger UI 설정 함수
 * 각 내부 서비스의 Swagger JSON 명세를 로드하여 UI에서 선택 가능하게 함.
 */
export const setupGatewayIntegratedSwagger = (app: INestApplication) => {
  const gatewaySelfApiConfig = new DocumentBuilder()
    .setTitle('API Gateway - Main Entry')
    .setDescription('Aggregated API documentation for all services.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'accessToken',
    )
    .build();
  const gatewaySelfDocument = SwaggerModule.createDocument(
    app,
    gatewaySelfApiConfig,
    {},
  );
  const swaggerCustomOptions: SwaggerCustomOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      urls: [
        {
          url: '/docs-json',
          name: 'Gateway',
        },
        {
          url: `${process.env.AUTH_SERVICE_URL}/docs-json`,
          name: 'Auth Service',
        },
        {
          url: `${process.env.EVENT_SERVICE_URL}/docs-json`,
          name: 'Event Service',
        },
      ],
      urlsPrimaryName: 'Gateway',
    },
  };

  SwaggerModule.setup('/docs', app, gatewaySelfDocument, swaggerCustomOptions);
};
