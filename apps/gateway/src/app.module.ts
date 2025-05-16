// apps/gateway/src/app.module.ts (수정 제안)
import { Module } from '@nestjs/common';
import { CommonConfigModule } from '@app/common/config/common-config.module'; // 그대로 사용
import { ConfigModule } from '@nestjs/config'; // ConfigModule 직접 임포트
import gatewayConfig from './config/gateway.config'; // gatewayConfig 임포트
import { ProxyModule } from './proxy/proxy.module'; // ProxyModule을 만들었다면
import { JwtStrategy } from '@app/gateway/auth/strategy/jwt.strategy';
import { CommonJwtModule } from '@app/common/jwt/jwt-config.module';

@Module({
  imports: [
    CommonConfigModule,
    ConfigModule.forFeature(gatewayConfig),
    CommonJwtModule,
    ProxyModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
