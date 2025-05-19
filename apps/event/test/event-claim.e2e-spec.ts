import { Role } from '@app/auth/domain/value-objects/role.vo';
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
} from '@app/event/event-claim/domain/entities/event-claim.entity';
import { EventDocument } from '@app/event/event-core/domain/entities/event.entity';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import { INestApplication, HttpStatus } from '@nestjs/common';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';

import request from 'supertest';
import { Connection, Model, Types } from 'mongoose';
import { EventAppModule } from '@app/event/event-app.module';
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

describe('EventClaimController (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let eventDbConnection: Connection;
  let authDbConnection: Connection;
  let eventClaimModel: Model<EventClaimDocument>;
  let eventModel: Model<EventDocument>;
  let useModel: Model<UserDocument>;

  const VALID_INTERNAL_API_KEY =
    process.env.GATEWAY_INTERNAL_API_KEY || 'E2E_TEST_API_KEY_FOR_EVENT_APP';

  const event1Id = new Types.ObjectId();
  const event2Id = new Types.ObjectId();

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        EventAppModule,
        MongooseModule.forRootAsync({
          connectionName: MONGO_CONNECTIONS.AUTH,
          useFactory: async () => ({
            uri: process.env.AUTH_MONGODB_URI,
          }),
        }),
        MongooseModule.forFeature(
          [{ name: User.name, schema: UserSchema }],
          MONGO_CONNECTIONS.AUTH,
        ),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    setupPipe(app);
    await app.init();

    eventDbConnection = moduleFixture.get<Connection>(
      getConnectionToken(MONGO_CONNECTIONS.EVENT),
    );
    authDbConnection = moduleFixture.get<Connection>(
      getConnectionToken(MONGO_CONNECTIONS.AUTH),
    );
    eventClaimModel = moduleFixture.get<Model<EventClaimDocument>>(
      getModelToken(EventClaim.name, MONGO_CONNECTIONS.EVENT),
    );
    eventModel = moduleFixture.get<Model<EventDocument>>(
      getModelToken(Event.name, MONGO_CONNECTIONS.EVENT),
    );
    useModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name, MONGO_CONNECTIONS.AUTH),
    );
  });

  beforeEach(async () => {
    await eventClaimModel.deleteMany({});
    await eventModel.deleteMany({});
    await useModel.deleteMany({});

    await useModel.insertMany(
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
    await eventDbConnection?.close();
    await authDbConnection?.close();
    await app.close();
  });

  const getAuthHeaders = (userId: Types.ObjectId, roles: Role[]) => ({
    [CustomHeaders.INTERNAL_API_KEY]: VALID_INTERNAL_API_KEY,
    [CustomHeaders.USER_ID]: userId.toHexString(),
    [CustomHeaders.USER_ROLES]: roles.join(','),
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
