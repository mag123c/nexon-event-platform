import { EVENT_CONDITION_MATCHER_SERVICE } from '@app/event/application/ports/event-condition-matcher.service';
import { USER_ACTIVITY_FETCHER } from '@app/event/application/ports/user-activity.fetcher';
import { EventConditionMatcherService } from '@app/event/application/services/event-condition-matcher.service';
import { EventConditionsValidatorService } from '@app/event/application/services/event-conditions-validator.service';
import { RewardDetailsValidatorService } from '@app/event/application/services/reward-details-validator.service';
import { ClaimRewardUseCase } from '@app/event/application/use-cases/claim-reward/claim-reward.usecase';
import { CreateEventUseCase } from '@app/event/application/use-cases/craete-event/create-event.usecase';
import { CreateRewardUseCase } from '@app/event/application/use-cases/create-reward/create-reward.usecase';
import {
  EventClaim,
  EventClaimSchema,
} from '@app/event/domain/event-claim/entities/event-claim.entity';
import { EVENT_CLAIM_FACTORY } from '@app/event/domain/event-claim/factories/event-claim.factory';
import { EVENT_CLAIM_REPOSITORY } from '@app/event/domain/event-claim/ports/event-claim.repository';
import { EventSchema } from '@app/event/domain/event/entities/event.entity';
import { EVENT_FACTORY } from '@app/event/domain/event/factories/event.factory';
import { EVENT_REPOSITORY } from '@app/event/domain/event/ports/event.repository';
import {
  Reward,
  RewardSchema,
} from '@app/event/domain/reward/entities/reward.entity';
import { REWARD_FACTORY } from '@app/event/domain/reward/factories/reward.factory';
import { REWARD_REPOSITORY } from '@app/event/domain/reward/ports/reward.repository';
import { UserActivityHttpFetcher } from '@app/event/infrastructure/adapters/auth-service/user-activity-http.fetcher';
import { EventClaimMongoFactory } from '@app/event/infrastructure/factories/event-claim-mongo.factory';
import { EventMongoFactory } from '@app/event/infrastructure/factories/event-mongo.factory';
import { RewardMongoFactory } from '@app/event/infrastructure/factories/reward-mongo.factory';
import { EventClaimMongoRepository } from '@app/event/infrastructure/persistence/event-claim.mongo.repository';
import { EventMongoRepository } from '@app/event/infrastructure/persistence/event-mongo.repository';
import { RewardMongoRepository } from '@app/event/infrastructure/persistence/reward-mongo.repository';
import { EventClaimController } from '@app/event/presentation/controllers/event-claim.controller';
import { EventController } from '@app/event/presentation/controllers/event.controller';
import { RewardController } from '@app/event/presentation/controllers/reward.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { CommonConfigModule } from '@app/common/config/common-config.module';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { ConfigModule } from '@nestjs/config';
import { authServiceConfig } from '@app/event/config/services.config';

@Module({
  imports: [
    CommonConfigModule,
    ConfigModule.forFeature(authServiceConfig),
    CommonMongooseModule.forRootAsync({
      configKey: 'EVENT_MONGODB_URI',
      connectionName: MONGO_CONNECTIONS.EVENT,
    }),
    MongooseModule.forFeature(
      [
        { name: Event.name, schema: EventSchema },
        { name: Reward.name, schema: RewardSchema },
        { name: EventClaim.name, schema: EventClaimSchema },
      ],
      MONGO_CONNECTIONS.EVENT,
    ),
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  controllers: [EventController, RewardController, EventClaimController],
  providers: [
    // Repositories
    { provide: EVENT_REPOSITORY, useClass: EventMongoRepository },
    { provide: REWARD_REPOSITORY, useClass: RewardMongoRepository },
    { provide: EVENT_CLAIM_REPOSITORY, useClass: EventClaimMongoRepository },

    // Factories
    { provide: EVENT_FACTORY, useClass: EventMongoFactory },
    { provide: REWARD_FACTORY, useClass: RewardMongoFactory },
    { provide: EVENT_CLAIM_FACTORY, useClass: EventClaimMongoFactory },

    // Application Services
    EventConditionsValidatorService,
    RewardDetailsValidatorService,
    {
      provide: EVENT_CONDITION_MATCHER_SERVICE,
      useClass: EventConditionMatcherService,
    },
    { provide: USER_ACTIVITY_FETCHER, useClass: UserActivityHttpFetcher },

    // Use Cases
    CreateEventUseCase,
    CreateRewardUseCase,
    ClaimRewardUseCase,
  ],
})
export class EventModule {}
