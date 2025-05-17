import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { ClaimRewardUseCase } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.usecase';
import {
  EventClaim,
  EventClaimSchema,
} from '@app/event/event-claim/domain/event-claim/entities/event-claim.entity';
import { EVENT_CLAIM_FACTORY } from '@app/event/event-claim/domain/event-claim/factories/event-claim.factory';
import { EVENT_CLAIM_REPOSITORY } from '@app/event/event-claim/domain/event-claim/ports/event-claim.repository';
import { EventClaimMongoFactory } from '@app/event/event-claim/infrastructure/factories/event-claim-mongo.factory';
import { EventClaimMongoRepository } from '@app/event/event-claim/infrastructure/persistence/event-claim.mongo.repository';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { EventClaimController } from '@app/event/presentation/controllers/event-claim.controller';
import { RewardModule } from '@app/event/reward/reward.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: EventClaim.name, schema: EventClaimSchema }],
      MONGO_CONNECTIONS.EVENT,
    ),
    EventCoreModule,
    RewardModule,
  ],
  controllers: [EventClaimController],
  providers: [
    { provide: EVENT_CLAIM_REPOSITORY, useClass: EventClaimMongoRepository },
    { provide: EVENT_CLAIM_FACTORY, useClass: EventClaimMongoFactory },
    ClaimRewardUseCase,
  ],
})
export class EventClaimModule {}
