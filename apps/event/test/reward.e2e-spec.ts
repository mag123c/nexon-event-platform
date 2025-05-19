import { Role } from '@app/auth/domain/value-objects/role.vo';
import {
  User,
  UserDocument,
  UserSchema,
} from '@app/auth/user/domain/entities/user.entity';
import { HttpExceptionFilter, setupPipe } from '@app/common';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  EventDocument,
  EventSchema,
} from '@app/event/event-core/domain/entities/event.entity';
import {
  RewardDocument,
  Reward,
  RewardSchema,
} from '@app/event/reward/domain/entities/reward.entity';
import { CreateRewardRequestDto } from '@app/event/reward/presentation/dtos/request/reward.request.dto';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  allUserFixturesForE2E,
  adminUserFixture,
  operatorUserFixture,
  userA_fixture,
} from '@auth/test/fixture/users.fixture';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import request from 'supertest';
import { AuthModule } from '@app/auth/auth.module';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { RewardModule } from '@app/event/reward/reward.module';
import {
  invalidDetailsItemRewardInputFixture,
  invalidQuantityRewardInputFixture,
  itemRewardInputFixture,
  mileageRewardInputFixture,
} from '@event/test/fixture/rewards.fixture';
import { generateRandomEventData } from '@event/test/fixture/event.fixture';

const envPath = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);
dotenv.config({ path: envPath });

describe('RewardController (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let eventModel: Model<EventDocument>;
  let userModel: Model<UserDocument>;
  let rewardModel: Model<RewardDocument>;

  const VALID_INTERNAL_API_KEY =
    process.env.GATEWAY_INTERNAL_API_KEY || 'E2E_REWARD_CONTROLLER_KEY';

  const getAuthHeaders = (userFixture: {
    _id: Types.ObjectId;
    roles: Role[];
  }) => ({
    [CustomHeaders.INTERNAL_API_KEY]: VALID_INTERNAL_API_KEY,
    [CustomHeaders.USER_ID]: userFixture._id.toHexString(),
    [CustomHeaders.USER_ROLES]: userFixture.roles.join(','),
  });

  // 테스트에 사용할 이벤트
  let testEventForRewards: EventDocument;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: envPath }),
        CommonMongooseModule.forRootAsync({
          configKey: 'EVENT_MONGODB_URI',
          connectionName: MONGO_CONNECTIONS.EVENT,
        }),
        CommonMongooseModule.forRootAsync({
          configKey: 'AUTH_MONGODB_URI',
          connectionName: MONGO_CONNECTIONS.AUTH,
        }),
        MongooseModule.forFeature(
          [
            { name: Event.name, schema: EventSchema },
            { name: User.name, schema: UserSchema },
            { name: Reward.name, schema: RewardSchema },
          ],
          MONGO_CONNECTIONS.EVENT,
        ),
        EventCoreModule,
        RewardModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    setupPipe(app);
    await app.init();

    eventModel = moduleFixture.get<Model<EventDocument>>(
      getModelToken(Event.name, MONGO_CONNECTIONS.EVENT),
    );
    rewardModel = moduleFixture.get<Model<RewardDocument>>(
      getModelToken(Reward.name, MONGO_CONNECTIONS.EVENT),
    );
    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name, MONGO_CONNECTIONS.AUTH),
    );
  });

  beforeEach(async () => {
    await rewardModel.deleteMany({});
    await eventModel.deleteMany({});
    await userModel.deleteMany({});

    await userModel.insertMany(
      allUserFixturesForE2E.map((u) => ({
        ...u,
        password: 'hashedPasswordForE2E',
      })),
    );

    // 보상 생성을 테스트할 기준 이벤트 하나 생성
    testEventForRewards = await eventModel.create(generateRandomEventData(0));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /rewards/:eventId (보상 생성)', () => {
    it('OPERATOR 역할로 유효한 데이터(mileageRewardInputFixture) 요청 시 201 Created 반환', async () => {
      const { eventId, createdBy, ...dtoData } = mileageRewardInputFixture;
      const createDto: CreateRewardRequestDto = dtoData;

      const response = await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(mileageRewardInputFixture.name);
      expect(response.body.eventId.toString()).toBe(
        testEventForRewards._id.toString(),
      );
      const rewardInDb = await rewardModel
        .findById(response.body.id)
        .lean()
        .exec();
      expect(rewardInDb).not.toBeNull();
    });

    it('ADMIN 역할로 아이템 보상(itemRewardInputFixture, 수량 무제한으로 변경) 생성 성공', async () => {
      const { eventId, createdBy, ...dtoData } = itemRewardInputFixture;
      const createDto: CreateRewardRequestDto = { ...dtoData, quantity: null };

      const response = await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(adminUserFixture))
        .send(createDto)
        .expect(HttpStatus.CREATED);
      expect(response.body.quantity).toBeNull();
      expect(response.body.remainingQuantity).toBeUndefined();
    });

    it('USER 역할로 보상 생성 요청 시 403 Forbidden 반환', async () => {
      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(userA_fixture))
        .send({} as CreateRewardRequestDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('존재하지 않는 eventId로 요청 시 404 Not Found 반환', async () => {
      const nonExistentEventId = new Types.ObjectId().toHexString();
      const { eventId, createdBy, ...dtoData } = mileageRewardInputFixture;
      await request(app.getHttpServer())
        .post(`/rewards/${nonExistentEventId}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(dtoData as CreateRewardRequestDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('필수 필드(name) 누락 시 400 Bad Request 반환', async () => {
      const { eventId, createdBy, name, ...invalidDtoData } =
        mileageRewardInputFixture;
      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(invalidDtoData as CreateRewardRequestDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('잘못된 details 정보(invalidDetailsItemRewardInputFixture)로 요청 시 400 Bad Request', async () => {
      const { eventId, createdBy, ...dtoData } =
        invalidDetailsItemRewardInputFixture;
      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(dtoData as CreateRewardRequestDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('유효하지 않은 quantity(invalidQuantityRewardInputFixture)로 요청 시 400 Bad Request', async () => {
      const { eventId, createdBy, ...dtoData } =
        invalidQuantityRewardInputFixture;
      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(dtoData as CreateRewardRequestDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('동일 이벤트 내 이미 같은 이름의 보상 존재 시 409 Conflict 반환', async () => {
      const { eventId, createdBy, ...dtoData } = mileageRewardInputFixture;
      const dto = { ...dtoData, name: '중복 테스트 보상 E2E' };

      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(dto)
        .expect(HttpStatus.CREATED);

      // 동일한 이름으로 다시 생성 시도
      await request(app.getHttpServer())
        .post(`/rewards/${testEventForRewards._id.toHexString()}`)
        .set(getAuthHeaders(operatorUserFixture))
        .send(dto)
        .expect(HttpStatus.CONFLICT);
    });
  });
});
