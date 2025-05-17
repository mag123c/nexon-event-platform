import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { EVENT_CONDITION_MATCHER_SERVICE } from '@app/event/event-core/application/ports/event-condition-matcher.service';
import { USER_ACTIVITY_FETCHER } from '@app/event/event-core/application/ports/user-activity.fetcher';
import { EventConditionsValidatorService } from '@app/event/event-core/application/services/event-conditions-validator.service';
import { CreateEventUseCase } from '@app/event/event-core/application/use-cases/craete-event/create-event.usecase';
import { EventSchema } from '@app/event/event-core/domain/entities/event.entity';
import { EVENT_FACTORY } from '@app/event/event-core/domain/factories/event.factory';
import { EVENT_REPOSITORY } from '@app/event/event-core/domain/ports/event.repository';
import { UserActivityHttpFetcher } from '@app/event/event-core/infrastructure/adapters/auth-service/user-activity-http.fetcher';
import { EventMongoFactory } from '@app/event/event-core/infrastructure/factories/event-mongo.factory';
import { EventMongoRepository } from '@app/event/event-core/infrastructure/persistence/event-mongo.repository';
import { EventController } from '@app/event/event-core/presentation/controllers/event.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { authServiceConfig } from '@app/event/config/services.config';
import { ConfigModule } from '@nestjs/config';
import { EventConditionMatcherService } from '@app/event/event-core/application/services/event-condition-matcher.service';

@Module({
  imports: [
    ConfigModule.forFeature(authServiceConfig),
    MongooseModule.forFeature(
      [{ name: Event.name, schema: EventSchema }],
      MONGO_CONNECTIONS.EVENT,
    ),
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  controllers: [EventController],
  providers: [
    { provide: EVENT_REPOSITORY, useClass: EventMongoRepository },
    { provide: EVENT_FACTORY, useClass: EventMongoFactory },
    { provide: USER_ACTIVITY_FETCHER, useClass: UserActivityHttpFetcher },
    {
      provide: EVENT_CONDITION_MATCHER_SERVICE,
      useClass: EventConditionMatcherService,
    },
    CreateEventUseCase,
    EventConditionsValidatorService,
  ],
  exports: [
    EVENT_REPOSITORY,
    EVENT_FACTORY,
    EVENT_CONDITION_MATCHER_SERVICE,
    USER_ACTIVITY_FETCHER,
  ],
})
export class EventCoreModule {}
