import { Module } from '@nestjs/common';
import { CommonConfigModule } from '@app/common/config/common-config.module';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from '@app/event/presentation/controllers/event.controller';
import {
  Event,
  EventSchema,
} from '@app/event/domain/event/entities/event.entity';
import {
  Reward,
  RewardSchema,
} from '@app/event/domain/reward/entities/reward.entity';
import { CreateEventUseCase } from '@app/event/application/use-cases/craete-event/create-event.usecase';
import { EVENT_REPOSITORY } from '@app/event/domain/event/ports/event.repository';
import { EventMongoRepository } from '@app/event/infrastructure/persistence/event-mongo.repository';
import { CreateRewardUseCase } from '@app/event/application/use-cases/create-reward/create-reward.usecase';
import { REWARD_REPOSITORY } from '@app/event/domain/reward/ports/reward.repository';
import { RewardMongoRepository } from '@app/event/infrastructure/persistence/reward-mongo.repository';
import { RewardController } from '@app/event/presentation/controllers/reward.controller';
import { EventConditionsValidatorService } from '@app/event/application/services/event-conditions-validator.service';
import { RewardDetailsValidatorService } from '@app/event/application/services/reward-details-validator.service';
import { REWARD_FACTORY } from '@app/event/domain/reward/factories/reward.factory';
import { EVENT_FACTORY } from '@app/event/domain/event/factories/event.factory';
import { EventMongoFactory } from '@app/event/infrastructure/factories/event-mongo.factory';
import { RewardMongoFactory } from '@app/event/infrastructure/factories/reward-mongo.factory';

@Module({
  imports: [
    CommonConfigModule,
    CommonMongooseModule.forRootAsync({
      configKey: 'EVENT_MONGODB_URI',
      connectionName: MONGO_CONNECTIONS.EVENT,
    }),
    MongooseModule.forFeature(
      [
        { name: Event.name, schema: EventSchema },
        { name: Reward.name, schema: RewardSchema },
      ],
      MONGO_CONNECTIONS.EVENT,
    ),
  ],
  controllers: [EventController, RewardController],
  providers: [
    // Event
    CreateEventUseCase,
    EventConditionsValidatorService,
    {
      provide: EVENT_REPOSITORY,
      useClass: EventMongoRepository,
    },
    {
      provide: EVENT_FACTORY,
      useClass: EventMongoFactory,
    },

    // Reward
    CreateRewardUseCase,
    RewardDetailsValidatorService,
    {
      provide: REWARD_REPOSITORY,
      useClass: RewardMongoRepository,
    },
    {
      provide: REWARD_FACTORY,
      useClass: RewardMongoFactory,
    },
  ],
})
export class EventModule {}
