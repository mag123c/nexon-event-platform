import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  Event,
  EventDocument,
  EventSchema,
} from '@app/event/event-core/domain/entities/event.entity';
import { EventNotFoundException } from '@app/event/event-core/domain/errors/event.exception';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { CreateRewardInput } from '@app/event/reward/application/use-cases/create-reward/create-reward.input';
import { ListRewardsByEventIdUseCaseInput } from '@app/event/reward/application/use-cases/list-rewards-by-event-id/list-rewards-by-event-id.input';
import { ListRewardsByEventIdUseCase } from '@app/event/reward/application/use-cases/list-rewards-by-event-id/list-rewards-by-event-id.usecase';
import {
  RewardDocument,
  Reward,
  RewardSchema,
} from '@app/event/reward/domain/entities/reward.entity';
import { RewardModule } from '@app/event/reward/reward.module';
import {
  mileageRewardInputFixture,
  itemRewardInputFixture,
} from '@event/test/fixture/rewards.fixture';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { generateNRandomEventData } from '@event/test/fixture/event.fixture';

const envPath = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);
dotenv.config({ path: envPath });

describe('ListRewardsByEventIdUseCase - Integration Tests', () => {
  let module: TestingModule;
  let listRewardsUseCase: ListRewardsByEventIdUseCase;
  let rewardModel: Model<RewardDocument>;
  let eventModel: Model<EventDocument>;

  const numberOfRandomEvents = Math.floor(Math.random() * 10) + 10; // 10~20개 랜덤 이벤트 생성
  let randomEventFixtures: Omit<
    Event,
    '_id' | 'createdAt' | 'updatedAt' | 'id'
  >[];
  let eventIdForSpecificRewardTest: Types.ObjectId;

  const createRewardFixtureForDB = (
    input: CreateRewardInput,
    eventId: Types.ObjectId,
  ): Partial<Reward> => ({
    eventId: eventId,
    name: input.name,
    description: input.description,
    type: input.type,
    details: input.details,
    quantity: input.quantity,
    remainingQuantity: input.quantity ?? undefined,
    createdBy: new Types.ObjectId(input.createdBy),
  });

  beforeAll(async () => {
    const dbUri = process.env.EVENT_MONGODB_URI;
    if (!dbUri) throw new Error('EVENT_MONGODB_URI is not defined');

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: envPath }),
        CommonMongooseModule.forRootAsync({
          configKey: 'EVENT_MONGODB_URI',
          connectionName: MONGO_CONNECTIONS.EVENT,
        }),
        MongooseModule.forFeature(
          [
            { name: Reward.name, schema: RewardSchema },
            { name: Event.name, schema: EventSchema },
          ],
          MONGO_CONNECTIONS.EVENT,
        ),
        RewardModule,
        EventCoreModule,
      ],
    }).compile();

    listRewardsUseCase = module.get<ListRewardsByEventIdUseCase>(
      ListRewardsByEventIdUseCase,
    );
    rewardModel = module.get<Model<RewardDocument>>(
      getModelToken(Reward.name, MONGO_CONNECTIONS.EVENT),
    );
    eventModel = module.get<Model<EventDocument>>(
      getModelToken(Event.name, MONGO_CONNECTIONS.EVENT),
    );
    randomEventFixtures = generateNRandomEventData(numberOfRandomEvents);
  });

  beforeEach(async () => {
    await rewardModel.deleteMany({});
    await eventModel.deleteMany({});

    const createdEvents = await eventModel.insertMany(randomEventFixtures);

    eventIdForSpecificRewardTest = createdEvents[0]._id;

    const rewardsToInsert = [
      createRewardFixtureForDB(
        {
          ...mileageRewardInputFixture,
          eventId: eventIdForSpecificRewardTest.toHexString(),
        },
        eventIdForSpecificRewardTest,
      ),
      createRewardFixtureForDB(
        {
          ...itemRewardInputFixture,
          name: '테스트 아이템 보상',
          eventId: eventIdForSpecificRewardTest.toHexString(),
        },
        eventIdForSpecificRewardTest,
      ),
    ];
    if (rewardsToInsert.length > 0) {
      await rewardModel.insertMany(rewardsToInsert);
    }
  });

  afterAll(async () => {
    await rewardModel.deleteMany({});
    await eventModel.deleteMany({});
    if (module) {
      await module.close();
    }
  });

  it('보상이 여러 개 연결된 이벤트 ID로 조회 시, 해당 보상 목록을 정확히 반환해야 한다', async () => {
    const input: ListRewardsByEventIdUseCaseInput = {
      eventId: eventIdForSpecificRewardTest.toHexString(),
    };
    const result = await listRewardsUseCase.execute(input);

    expect(result.rewards).toHaveLength(2);
    const rewardNames = result.rewards.map((r) => r.name);
    expect(rewardNames).toContain(mileageRewardInputFixture.name);
    expect(rewardNames).toContain('테스트 아이템 보상');
  });

  it('존재하지 않는 이벤트 ID로 조회 시 EventNotFoundException을 던져야 한다', async () => {
    const nonExistentEventId = new Types.ObjectId();
    const input: ListRewardsByEventIdUseCaseInput = {
      eventId: nonExistentEventId.toHexString(),
    };

    await expect(listRewardsUseCase.execute(input)).rejects.toThrow(
      EventNotFoundException,
    );
  });
});
