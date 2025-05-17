import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { RewardDetailsValidatorService } from '@app/event/reward/application/services/reward-details-validator.service';
import { CreateRewardUseCase } from '@app/event/reward/application/use-cases/create-reward/create-reward.usecase';
import {
  Reward,
  RewardSchema,
} from '@app/event/reward/domain/entities/reward.entity';
import { REWARD_FACTORY } from '@app/event/reward/domain/factories/reward.factory';
import { REWARD_REPOSITORY } from '@app/event/reward/domain/ports/reward.repository';
import { RewardMongoFactory } from '@app/event/reward/infrastructure/factories/reward-mongo.factory';
import { RewardMongoRepository } from '@app/event/reward/infrastructure/persistence/reward-mongo.repository';
import { RewardController } from '@app/event/reward/presentation/controllers/reward.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Reward.name, schema: RewardSchema }],
      MONGO_CONNECTIONS.EVENT,
    ),
    EventCoreModule,
  ],
  controllers: [RewardController],
  providers: [
    { provide: REWARD_REPOSITORY, useClass: RewardMongoRepository },
    { provide: REWARD_FACTORY, useClass: RewardMongoFactory },
    RewardDetailsValidatorService,
    CreateRewardUseCase,
  ],
  exports: [REWARD_REPOSITORY, REWARD_FACTORY],
})
export class RewardModule {}
