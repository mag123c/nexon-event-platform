import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import gatewayConfig from '../config/gateway.config';

import { ProxyRequestService } from './services/proxy-request.service';
import { AuthProxyController } from '@app/gateway/proxy/controllers/auth-proxy.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule.forFeature(gatewayConfig),
  ],
  providers: [ProxyRequestService],
  exports: [ProxyRequestService],
  controllers: [AuthProxyController],
})
export class ProxyModule {}
