import {
  User,
  UserDocument,
  UserSchema,
} from '@app/auth/user/domain/entities/user.entity';
import {
  ForbiddenRoleException,
  HttpExceptionFilter,
  setupPipe,
} from '@app/common';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  EventClaimDocument,
  EventClaim,
  ClaimStatus,
  EventClaimSchema,
} from '@app/event/event-claim/domain/entities/event-claim.entity';
import {
  EventDocument,
  EventSchema,
} from '@app/event/event-core/domain/entities/event.entity';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';

import request from 'supertest';
import { Model, Types } from 'mongoose';
import { generateRandomEventData } from '@event/test/fixture/event.fixture';
import { createEventClaimFixture } from '@event/test/fixture/event-claims.fixture';
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import {
  admin_Id_fixture,
  adminUserFixture,
  allUserFixturesForE2E,
  operator_Id_fixture,
  operatorUserFixture,
  userA_fixture,
  userA_Id_fixture,
  userB_Id_fixture,
} from '@auth/test/fixture/users.fixture';
import { AuthModule } from '@app/auth/auth.module';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import {
  Reward,
  RewardDocument,
  RewardSchema,
} from '@app/event/reward/domain/entities/reward.entity';
import { RewardModule } from '@app/event/reward/reward.module';
import { ConfigModule } from '@nestjs/config';
import { EventClaimModule } from '@app/event/event-claim/event-claim.module';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);
dotenv.config({ path: envPath });

describe('EventClaimController (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let eventClaimModel: Model<EventClaimDocument>;
  let eventModel: Model<EventDocument>;
  let userModel: Model<UserDocument>;
  let rewardModel: Model<RewardDocument>;

  const VALID_INTERNAL_API_KEY =
    process.env.GATEWAY_INTERNAL_API_KEY || 'E2E_TEST_API_KEY_FOR_EVENT_APP';

  const getAuthHeaders = (userId: Types.ObjectId, roles: Role[]) => ({
    [CustomHeaders.INTERNAL_API_KEY]: VALID_INTERNAL_API_KEY,
    [CustomHeaders.USER_ID]: userId.toHexString(),
    [CustomHeaders.USER_ROLES]: roles.join(','),
  });

  const event1Id = new Types.ObjectId();
  const event2Id = new Types.ObjectId();

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
            { name: EventClaim.name, schema: EventClaimSchema },
          ],
          MONGO_CONNECTIONS.EVENT,
        ),
        EventCoreModule,
        RewardModule,
        EventClaimModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    setupPipe(app);
    await app.init();

    eventClaimModel = moduleFixture.get<Model<EventClaimDocument>>(
      getModelToken(EventClaim.name, MONGO_CONNECTIONS.EVENT),
    );
    eventModel = moduleFixture.get<Model<EventDocument>>(
      getModelToken(Event.name, MONGO_CONNECTIONS.EVENT),
    );
    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name, MONGO_CONNECTIONS.AUTH),
    );
    rewardModel = moduleFixture.get<Model<RewardDocument>>(
      getModelToken(Reward.name, MONGO_CONNECTIONS.EVENT),
    );
  });

  beforeEach(async () => {
    await eventClaimModel.deleteMany({});
    await eventModel.deleteMany({});
    await userModel.deleteMany({});

    await userModel.insertMany(
      allUserFixturesForE2E.map((u) => ({ ...u, password: 'hashedPassword' })),
    );

    const event1Data = generateRandomEventData(1);
    const event2Data = generateRandomEventData(2);
    await eventModel.create([
      {
        ...event1Data,
        _id: event1Id,
        name: 'E2E Event 1 (Active)',
        status: EventStatus.ACTIVE,
      },
      {
        ...event2Data,
        _id: event2Id,
        name: 'E2E Event 2 (Active)',
        status: EventStatus.ACTIVE,
      },
    ]);

    const now = new Date();
    await eventClaimModel.insertMany([
      createEventClaimFixture({
        userId: userA_Id_fixture,
        eventId: event1Id,
        status: ClaimStatus.SUCCESS,
        requestedAt: new Date(now.getTime() - 2 * 3600000),
        grantedRewardsCount: 1,
      }),
      createEventClaimFixture({
        userId: userA_Id_fixture,
        eventId: event2Id,
        status: ClaimStatus.FAILED_CONDITIONS_NOT_MET,
        requestedAt: new Date(now.getTime() - 1 * 3600000),
        conditionDetail: {
          category: EventConditionCategory.USER_ACTIVITY,
          type: 'LOGIN_STREAK_DAYS',
          operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
          value: 10,
        },
      }),
      createEventClaimFixture({
        userId: userB_Id_fixture,
        eventId: event1Id,
        status: ClaimStatus.SUCCESS,
        requestedAt: now,
        grantedRewardsCount: 2,
      }),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /claims/:eventId (보상 요청)', () => {
    it('조건 미달 유저가 요청 시 400 Bad Request', async () => {
      const event = await eventModel.create({
        ...generateRandomEventData(2),
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        condition: {
          category: 'USER_ACTIVITY',
          type: 'LOGIN_STREAK_DAYS',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 10,
          unit: 'days',
          description: '10일 이상 연속 로그인',
        },
      });

      await request(app.getHttpServer())
        .post(`/claims/${event._id.toHexString()}`)
        .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('존재하지 않는 eventId 요청 시 404 Not Found', async () => {
      const fakeEventId = new Types.ObjectId().toHexString();

      await request(app.getHttpServer())
        .post(`/claims/${fakeEventId}`)
        .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
        .expect(HttpStatus.NOT_FOUND);
    });

    it('유저 활동 정보 없음 → 400 Bad Request', async () => {
      const event = await eventModel.create({
        ...generateRandomEventData(3),
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        condition: {
          category: 'USER_ACTIVITY',
          type: 'INVITED_FRIENDS_COUNT',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 10,
          unit: '명',
          description: '친구 10명 초대',
        },
      });

      const newUser = await userModel.create({
        email: 'no.activity@example.com',
        roles: [Role.USER],
        password: 'hashed',
      });

      await request(app.getHttpServer())
        .post(`/claims/${event._id.toHexString()}`)
        .set(getAuthHeaders(newUser._id, newUser.roles))
        .expect(HttpStatus.BAD_REQUEST);
    });

    /* Mongo DB Transaction 처리 (Replica Set)을 테스트환경에서 구성하지 못함
     * 도커 컨테이너 기반의 테스트 Mongo DB를 로컬 환경에서 테스트할 때 URL 접근이 안되는 상태.
     * 아래 주석된 코드들은 테스트 환경의 DB 구축 후 반영 가능.
     */

    // it('USER 역할(userA_fixture)로 조건 충족 이벤트에 요청 시 201 Created', async () => {
    //   const event = await eventModel.create({
    //     ...generateRandomEventData(0),
    //     status: 'ACTIVE',
    //     startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    //     endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    //     condition: {
    //       category: 'USER_ACTIVITY',
    //       type: 'LOGIN_STREAK_DAYS',
    //       operator: 'GREATER_THAN_OR_EQUAL',
    //       value: 3,
    //       unit: 'days',
    //       description: '3일 이상 연속 로그인',
    //     },
    //   });

    //   const response = await request(app.getHttpServer())
    //     .post(`/claims/${event._id.toHexString()}`)
    //     .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
    //     .expect(HttpStatus.CREATED);

    //   expect(response.body).toHaveProperty('status', 'SUCCESS');
    //   expect(response.body).toHaveProperty(
    //     'userId',
    //     userA_fixture._id.toHexString(),
    //   );
    // });

    // it('이미 보상을 수령한 유저가 재요청 시 409 Conflict', async () => {
    //   const event = await eventModel.create({
    //     ...generateRandomEventData(1),
    //     status: 'ACTIVE',
    //     startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    //     endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    //     condition: {
    //       category: 'USER_ACTIVITY',
    //       type: 'LOGIN_STREAK_DAYS',
    //       operator: 'GREATER_THAN_OR_EQUAL',
    //       value: 3,
    //       unit: 'days',
    //       description: '3일 이상 연속 로그인',
    //     },
    //   });

    //   await request(app.getHttpServer())
    //     .post(`/claims/${event._id.toHexString()}`)
    //     .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
    //     .expect(HttpStatus.CREATED);

    //   await request(app.getHttpServer())
    //     .post(`/claims/${event._id.toHexString()}`)
    //     .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
    //     .expect(HttpStatus.CONFLICT);
    // });

    // it('보상이 모두 소진된 경우 400 Bad Request', async () => {
    //   const event = await eventModel.create({
    //     ...generateRandomEventData(4),
    //     status: 'ACTIVE',
    //     startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    //     endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    //     condition: {
    //       category: 'USER_ACTIVITY',
    //       type: 'LOGIN_STREAK_DAYS',
    //       operator: 'GREATER_THAN_OR_EQUAL',
    //       value: 3,
    //       unit: 'days',
    //       description: '3일 이상 연속 로그인',
    //     },
    //   });

    //   await rewardModel.create({
    //     eventId: event._id,
    //     name: '한정 보상',
    //     description: '단 1명만 수령 가능',
    //     type: 'MILEAGE',
    //     details: { amount: 500 },
    //     quantity: 1,
    //     remainingQuantity: 0,
    //     createdBy: operator_Id_fixture,
    //   });

    //   await request(app.getHttpServer())
    //     .post(`/claims/${event._id.toHexString()}`)
    //     .set(getAuthHeaders(userA_fixture._id, userA_fixture.roles))
    //     .expect(HttpStatus.BAD_REQUEST);
    // });
  });

  describe('GET /claims/me (내 보상 요청 이력)', () => {
    it('USER 역할(userA_fixture)로 요청 시 자신의 클레임 목록만 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/claims/me?limit=5')
        .set(getAuthHeaders(userA_Id_fixture, userA_fixture.roles))
        .expect(HttpStatus.OK);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalItems).toBe(2);
      response.body.items.forEach((item: any) => {
        expect(item.userId.toString()).toBe(userA_Id_fixture.toString());
      });
    });
  });

  describe('GET /claims/admin (관리자용 전체/필터링 조회)', () => {
    it('ADMIN 역할로 요청 시 모든 클레임 목록을 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/claims/admin?limit=10')
        .set(getAuthHeaders(admin_Id_fixture, adminUserFixture.roles))
        .expect(HttpStatus.OK);

      expect(response.body.items).toHaveLength(3);
      expect(response.body.totalItems).toBe(3);
    });

    it('OPERATOR 역할, userId 필터: userA의 클레임만 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/claims/admin?userId=${userA_Id_fixture.toHexString()}`)
        .set(getAuthHeaders(operator_Id_fixture, operatorUserFixture.roles))
        .expect(HttpStatus.OK);

      expect(response.body.items).toHaveLength(2);
      response.body.items.forEach((item: any) => {
        expect(item.userId.toString()).toBe(userA_Id_fixture.toString());
      });
    });

    it('USER 역할로 요청 시 403 Forbidden을 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/claims/admin?limit=10')
        .set(getAuthHeaders(userA_Id_fixture, userA_fixture.roles))
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe(new ForbiddenRoleException().message);
    });
  });
});
