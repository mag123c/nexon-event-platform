import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import gatewayConfig from '../config/gateway-proxy.config';

import { ProxyRequestService } from './services/proxy-request.service';
import { AuthProxyController } from '@app/gateway/proxy/controllers/auth-proxy.controller';
import { RewardProxyController } from '@app/gateway/proxy/controllers/reward-proxy.controller';
import { EventClaimProxyController } from '@app/gateway/proxy/controllers/event-claim-proxy.contorller';
import { EventProxyController } from '@app/gateway/proxy/controllers/event-proxy.controller';
import { UserProxyController } from '@app/gateway/proxy/controllers/user-proxy.controller';

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
  controllers: [
    AuthProxyController,
    EventProxyController,
    EventClaimProxyController,
    RewardProxyController,
    UserProxyController,
  ],
})
export class ProxyModule {}
