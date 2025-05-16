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
} from '@app/event/domain/rewards/entities/rewards.entity';
import { CreateEventUseCase } from '@app/event/application/use-cases/craete-event/create-event.usecase';
import { EVENT_REPOSITORY } from '@app/event/domain/event/ports/event.repository';
import { EventMongoRepository } from '@app/event/infrastructure/persistence/event-mongo.repository';

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
  controllers: [EventController],
  providers: [
    CreateEventUseCase,
    {
      provide: EVENT_REPOSITORY,
      useClass: EventMongoRepository,
    },
  ],
})
export class EventModule {}
