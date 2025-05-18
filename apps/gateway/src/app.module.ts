import { CommonConfigModule } from '@app/common/config/common-config.module';
import { CommonJwtModule } from '@app/common/jwt/jwt-config.module';
import { JwtStrategy } from '@app/gateway/auth/strategy/jwt.strategy';
import gatewayProxyConfig from '@app/gateway/config/gateway-proxy.config';
import { ProxyModule } from '@app/gateway/proxy/proxy.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CommonConfigModule,
    ConfigModule.forFeature(gatewayProxyConfig),
    CommonJwtModule,
    ProxyModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
