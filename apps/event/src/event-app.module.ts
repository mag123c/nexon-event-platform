import { CommonConfigModule } from '@app/common/config/common-config.module';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { authServiceConfig } from '@app/event/config/services.config';
import { EventClaimModule } from '@app/event/event-claim/event-claim.module';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { RewardModule } from '@app/event/reward/reward.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CommonConfigModule,
    ConfigModule.forFeature(authServiceConfig),
    CommonMongooseModule.forRootAsync({
      configKey: 'EVENT_MONGODB_URI',
      connectionName: MONGO_CONNECTIONS.EVENT,
    }),
    EventCoreModule,
    RewardModule,
    EventClaimModule,
  ],
})
export class EventAppModule {}
