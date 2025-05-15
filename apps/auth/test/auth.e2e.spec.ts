import { AuthModule } from '@app/auth/auth.module';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@app/auth/domain/ports/user.repository';
import { RegisterUserRequestDto } from '@app/auth/presentation/dtos/request/register-user.request.dto';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { Connection, Model } from 'mongoose';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { HttpExceptionFilter, setupPipe } from '@app/common';
import { User, UserDocument } from '@app/auth/domain/entities/user.entity';

describe('AuthController (E2E - /auth/register with Real Repository)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let userRepository: UserRepository;
  let userModel: Model<UserDocument>;

  const AUTH_DB_CONNECTION_NAME = MONGO_CONNECTIONS.AUTH;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    setupPipe(app);
    await app.init();

    dbConnection = moduleFixture.get<Connection>(
      getConnectionToken(AUTH_DB_CONNECTION_NAME),
    );
    userRepository = moduleFixture.get<UserRepository>(USER_REPOSITORY);
    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name, AUTH_DB_CONNECTION_NAME),
    );
  });

  beforeEach(async () => {
    const userModel = dbConnection.model('User');
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await dbConnection?.close();
    await app.close();
  });

  const registerDto: RegisterUserRequestDto = {
    email: 'test-e2e@example.com',
    password: 'password123',
  };

  describe('POST /auth/register - 성공적인 가입', () => {
    it('유효한 데이터로 요청 시 201 상태 코드와 사용자 정보를 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.email).toBe(registerDto.email);

      const userInDb = await userRepository.findByEmail(registerDto.email);
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(registerDto.email);
      expect(userInDb?.password).toBeUndefined(); // 비밀번호는 몽구스에서 숨겨짐
    });
  });

  describe('POST /auth/register - 필수 값 유효성 검사', () => {
    it('이메일이 누락된 경우 400 Bad Request를 반환해야 한다', async () => {
      const { email, ...invalidDtoWithoutEmail } = registerDto;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDtoWithoutEmail)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBeInstanceOf(Array);
          expect(response.body.message).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                property: 'email',
                constraints: expect.objectContaining({
                  isNotEmpty: 'email should not be empty',
                  isEmail: 'email must be an email',
                }),
              }),
            ]),
          );
        });
    });

    it('비밀번호가 너무 짧은 경우 400 Bad Request를 반환해야 한다', async () => {
      const invalidDto = { ...registerDto, password: '123' };
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBeInstanceOf(Array);
          expect(response.body.message).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                property: 'password',
                constraints: expect.objectContaining({
                  minLength: expect.stringMatching(
                    /password must be longer than or equal to \d+ characters/,
                  ),
                }),
              }),
            ]),
          );
        });
    });
  });

  describe('POST /auth/register - 이메일 중복 방지', () => {
    it('이미 존재하는 이메일로 요청 시 409 Conflict를 반환해야 한다', async () => {
      const existingUser = {
        email: registerDto.email,
        password: 'hashedDummyPassword123',
        name: 'Existing User',
        roles: [Role.USER],
      };
      await userModel.create(existingUser);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.statusCode).toBe(HttpStatus.CONFLICT);
          expect(response.body.message).toBe(
            `User with email ${registerDto.email} already exists.`,
          );
        });
    });
  });
});
