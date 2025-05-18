import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { ListEventsUseCaseInput } from '@app/event/event-core/application/use-cases/list-event/list-event.input';
import { ListEventsUseCase } from '@app/event/event-core/application/use-cases/list-event/list-event.usecase';
import {
  Event,
  EventDocument,
  EventSchema,
} from '@app/event/event-core/domain/entities/event.entity';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { generateNRandomEventData } from '@event/test/fixture/event.fixture';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';

const envPath = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);
dotenv.config({ path: envPath });

describe('ListEventsUseCase - Integration Tests', () => {
  let module: TestingModule;
  let listEventsUseCase: ListEventsUseCase;
  let eventModel: Model<EventDocument>;
  const numberOfEvents = 100;
  let eventFixtures: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'id'>[];

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
          [{ name: Event.name, schema: EventSchema }],
          MONGO_CONNECTIONS.EVENT,
        ),
        EventCoreModule,
      ],
    }).compile();

    listEventsUseCase = module.get<ListEventsUseCase>(ListEventsUseCase);
    eventModel = module.get<Model<EventDocument>>(
      getModelToken(Event.name, MONGO_CONNECTIONS.EVENT),
    );

    eventFixtures = generateNRandomEventData(numberOfEvents);
  });

  beforeEach(async () => {
    await eventModel.deleteMany({});
    await eventModel.insertMany(eventFixtures);
  });

  afterAll(async () => {
    await eventModel.deleteMany({});
    await module.close();
  });

  it('기본 페이지네이션으로 모든 이벤트를 조회해야 한다 (기본 정렬: createdAt 내림차순)', async () => {
    const input: ListEventsUseCaseInput = { page: 1, limit: 10 };
    const result = await listEventsUseCase.execute(input);

    expect(result.events).toHaveLength(Math.min(eventFixtures.length, 10));
    expect(result.totalCount).toBe(eventFixtures.length);
    expect(result.currentPage).toBe(1);
  });

  it('상태(status)로 필터링하여 ACTIVE 이벤트만 조회해야 한다', async () => {
    const input: ListEventsUseCaseInput = { status: EventStatus.ACTIVE };
    const result = await listEventsUseCase.execute({ ...input, limit: 100 });

    const activeEventsCount = eventFixtures.filter(
      (e) => e.status === EventStatus.ACTIVE,
    ).length;
    expect(result.events).toHaveLength(activeEventsCount);
    result.events.forEach((event) => {
      expect(event.status).toBe(EventStatus.ACTIVE);
    });
    expect(result.totalCount).toBe(activeEventsCount);
  });

  it('이름(name)으로 부분 일치 검색하여 이벤트를 조회해야 한다', async () => {
    const input: ListEventsUseCaseInput = { name: '활성' };
    const result = await listEventsUseCase.execute(input);

    const matchedEventsCount = eventFixtures.filter((e) =>
      e.name?.includes('활성'),
    ).length;
    expect(result.events).toHaveLength(matchedEventsCount);
    result.events.forEach((event) => {
      expect(event.name).toContain('활성');
    });
  });

  it('페이지네이션(page, limit)이 올바르게 동작해야 한다', async () => {
    const input1: ListEventsUseCaseInput = { page: 1, limit: 2 };
    const result1 = await listEventsUseCase.execute(input1);
    expect(result1.events).toHaveLength(2);
    expect(result1.currentPage).toBe(1);
    expect(result1.hasNextPage).toBe(eventFixtures.length > 2);

    if (eventFixtures.length > 2) {
      const input2: ListEventsUseCaseInput = { page: 2, limit: 2 };
      const result2 = await listEventsUseCase.execute(input2);
      expect(result2.events).toHaveLength(
        Math.min(eventFixtures.length - 2, 2),
      );
      expect(result2.currentPage).toBe(2);
    }
  });

  it('정렬(sortBy, sortOrder)이 올바르게 동작해야 한다 (예: 이름 오름차순)', async () => {
    const input: ListEventsUseCaseInput = { sortBy: 'name', sortOrder: 'asc' };
    const result = await listEventsUseCase.execute(input);

    const sortedNames = [...eventFixtures]
      .map((e) => e.name!)
      .sort((a, b) => a.localeCompare(b));
    result.events.forEach((event, index) => {
      expect(event.name).toBe(sortedNames[index]);
    });
  });
});
