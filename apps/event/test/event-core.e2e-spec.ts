import { Role } from '@app/auth/domain/value-objects/role.vo';
import {
  User,
  UserDocument,
  UserSchema,
} from '@app/auth/user/domain/entities/user.entity';
import { HttpExceptionFilter, setupPipe } from '@app/common';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  EventDocument,
  EventSchema,
} from '@app/event/event-core/domain/entities/event.entity';
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { EventCoreModule } from '@app/event/event-core/event-core.module';
import { CreateEventRequestDto } from '@app/event/event-core/presentation/dtos/request/event.request.dto';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  allUserFixturesForE2E,
  operatorUserFixture,
  adminUserFixture,
  userA_fixture,
} from '@auth/test/fixture/users.fixture';
import { loginCountConditionFixture } from '@event/test/fixture/event-conditions.fixture';
import { generateRandomEventData } from '@event/test/fixture/event.fixture';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import path from 'path';
import dotenv from 'dotenv';
import { AuthModule } from '@app/auth/auth.module';

const envPath = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);
dotenv.config({ path: envPath });

describe('EventController (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let eventModel: Model<EventDocument>;
  let userModel: Model<UserDocument>;

  const VALID_INTERNAL_API_KEY =
    process.env.GATEWAY_INTERNAL_API_KEY || 'E2E_EVENT_KEY_FULL';
  const INVALID_INTERNAL_API_KEY = 'INVALID_KEY_FOR_TEST';

  const getAuthHeaders = (user?: { _id: Types.ObjectId; roles: Role[] }) => {
    const headers: Record<string, string> = {
      [CustomHeaders.INTERNAL_API_KEY]: VALID_INTERNAL_API_KEY,
    };
    if (user && user._id) {
      headers[CustomHeaders.USER_ID] = user._id.toHexString();
      headers[CustomHeaders.USER_ROLES] = user.roles.join(',');
    }
    return headers;
  };

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
          ],
          MONGO_CONNECTIONS.EVENT,
        ),
        EventCoreModule,
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
    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name, MONGO_CONNECTIONS.AUTH),
    );
  });

  beforeEach(async () => {
    await eventModel.deleteMany({});
    await userModel.deleteMany({});
    await userModel.insertMany(
      allUserFixturesForE2E.map((u) => ({
        ...u,
        password: 'hashedPasswordForE2E',
      })),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /events (이벤트 생성)', () => {
    it('OPERATOR 역할로 유효한 데이터 요청 시 201 Created와 생성된 이벤트 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      const dto: CreateEventRequestDto = {
        name: 'E2E 생성 테스트 이벤트 - Operator',
        description: randomBaseData.description,
        startDate: randomBaseData.startDate.toISOString(),
        endDate: randomBaseData.endDate.toISOString(),
        status: EventStatus.ACTIVE,
        condition: loginCountConditionFixture,
        requiresManualApproval: false,
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(operatorUserFixture))
        .send(dto)
        .expect(HttpStatus.CREATED);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(dto.name);
      expect(response.body.status).toBe(dto.status);
      expect(response.body.condition.type).toBe(dto.condition.type);
      const eventInDb = await eventModel
        .findById(response.body.id)
        .lean()
        .exec();
      expect(eventInDb).not.toBeNull();
      expect(eventInDb?.name).toBe(dto.name);
    });

    it('ADMIN 역할로 유효한 데이터 요청 시 201 Created 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      const dto: CreateEventRequestDto = {
        name: 'E2E 생성 테스트 이벤트 - Amdin',
        description: randomBaseData.description,
        startDate: randomBaseData.startDate.toISOString(),
        endDate: randomBaseData.endDate.toISOString(),
        status: EventStatus.ACTIVE,
        condition: loginCountConditionFixture,
        requiresManualApproval: false,
      };
      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(adminUserFixture))
        .send(dto)
        .expect(HttpStatus.CREATED);
    });

    it('USER 역할로 요청 시 403 Forbidden 반환', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(userA_fixture))
        .send({} as CreateEventRequestDto) // 빈 데이터로 요청해도 가드에 의해 earlyreturn
        .expect(HttpStatus.FORBIDDEN);
    });

    it('X-Internal-API-Key 헤더 누락 시 401 Unauthorized 반환', async () => {
      const headers = getAuthHeaders(operatorUserFixture);
      delete headers[CustomHeaders.INTERNAL_API_KEY]; // API 키 제거
      await request(app.getHttpServer())
        .post('/events')
        .set(headers)
        .send({} as CreateEventRequestDto) // 빈 데이터로 요청해도 가드에 의해 earlyreturn
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('잘못된 X-Internal-API-Key 헤더 시 401 Unauthorized 반환', async () => {
      const headers = getAuthHeaders(operatorUserFixture);
      headers[CustomHeaders.INTERNAL_API_KEY] = INVALID_INTERNAL_API_KEY;
      await request(app.getHttpServer())
        .post('/events')
        .set(headers)
        .send({} as CreateEventRequestDto) // 빈 데이터로 요청해도 가드에 의해 earlyreturn
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('필수 필드(name) 누락 시 400 Bad Request 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      const invalidNameDto: Omit<CreateEventRequestDto, 'name'> = {
        description: randomBaseData.description,
        startDate: randomBaseData.startDate.toISOString(),
        endDate: randomBaseData.endDate.toISOString(),
        status: EventStatus.ACTIVE,
        condition: loginCountConditionFixture,
        requiresManualApproval: false,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(operatorUserFixture))
        .send(invalidNameDto as CreateEventRequestDto) // 이름이 빠졌지만 단언으로 요청
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('이벤트 기간이 잘못된 경우 (시작일 > 종료일) 400 Bad Request 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      const invalidDateDto: CreateEventRequestDto = {
        name: '잘못된 이벤트 기간 테스트',
        description: randomBaseData.description,
        startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        status: EventStatus.ACTIVE,
        condition: loginCountConditionFixture,
        requiresManualApproval: false,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(operatorUserFixture))
        .send(invalidDateDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).toContain(
            '이벤트 시작일은 종료일보다 이전이어야 합니다.',
          );
        });
    });

    it('이미 존재하는 이벤트 이름으로 생성 시도 시 409 Conflict 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      await eventModel.create({
        ...randomBaseData,
        createdBy: operatorUserFixture._id,
      }); // 먼저 하나 생성

      const duplicateEventNameDto: CreateEventRequestDto = {
        name: randomBaseData.name,
        description: randomBaseData.description,
        startDate: randomBaseData.startDate.toISOString(),
        endDate: randomBaseData.endDate.toISOString(),
        status: EventStatus.ACTIVE,
        condition: loginCountConditionFixture,
        requiresManualApproval: false,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(operatorUserFixture))
        .send(duplicateEventNameDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('지원하지 않는 조건 타입으로 생성 시도 시 400 Bad Request 반환', async () => {
      const randomBaseData = generateRandomEventData(Math.random() * 10);
      const invalidEventTypeDto: CreateEventRequestDto = {
        name: '지원하지 않는 조건 타입 테스트',
        description: randomBaseData.description,
        startDate: randomBaseData.startDate.toISOString(),
        endDate: randomBaseData.endDate.toISOString(),
        status: EventStatus.ACTIVE,
        condition: {
          category: EventConditionCategory.USER_ACTIVITY,
          type: 'INVALID_TYPE_FOR_E2E_TEST',
          operator: EventConditionOperator.EQUALS,
          value: 1,
        },
        requiresManualApproval: false,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(getAuthHeaders(operatorUserFixture))
        .send(invalidEventTypeDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
