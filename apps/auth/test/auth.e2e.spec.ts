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
import { HASHING_PORT, HashingPort } from '@app/auth/domain/ports/hasing.port';
import { LoginRequestDto } from '@app/auth/presentation/dtos/request/login-user.request.dto';

describe('AuthController (E2E)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let userRepository: UserRepository;
  let userModel: Model<UserDocument>;
  let hashingService: HashingPort;

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
    hashingService = moduleFixture.get<HashingPort>(HASHING_PORT);
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

  describe('POST /auth/register', () => {
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

  describe('POST /auth/login', () => {
    const loginUserEmail = 'login-e2e@example.com';
    const loginUserPassword = 'password123';
    let hashedPasswordForLoginTest: string;

    beforeEach(async () => {
      await userModel.deleteMany({});
      hashedPasswordForLoginTest = await hashingService.hash(loginUserPassword);
      await userModel.create({
        email: loginUserEmail,
        password: hashedPasswordForLoginTest, // DB에는 해시된 비밀번호 저장
        name: 'Login Test User',
        roles: [Role.USER],
      });
    });

    const loginDto: LoginRequestDto = {
      email: loginUserEmail,
      password: loginUserPassword,
    };

    it('올바른 자격 증명으로 요청 시 200 상태 코드와 토큰 정보를 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');

      // DB에 Refresh Token 정보가 저장/업데이트되었는지 확인
      const userInDb = await userModel
        .findOne({ email: loginUserEmail })
        .select('+refreshToken +refreshTokenExpiresAt')
        .lean();
      expect(userInDb?.refreshToken).toBeDefined();
      // 응답으로 받은 refreshToken은 평문이므로, DB의 해시된 값과 달라야 함
      const isSameToken = await hashingService.compare(
        response.body.refreshToken,
        userInDb!.refreshToken!,
      );
      expect(isSameToken).toBe(true); // 평문 refreshToken을 해싱하면 DB의 값과 같아야 함
    });

    it('존재하지 않는 이메일로 요청 시 404 Not Found를 반환해야 한다', async () => {
      const wrongEmailDto: LoginRequestDto = {
        email: 'wrong-email@example.com',
        password: loginUserPassword,
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongEmailDto)
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.message).toContain('not found');
        });
    });

    it('잘못된 비밀번호로 요청 시 401 Unauthorized를 반환해야 한다', async () => {
      const wrongPasswordDto: LoginRequestDto = {
        email: loginUserEmail,
        password: 'wrongPassword123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongPasswordDto)
        .expect(HttpStatus.UNAUTHORIZED)
        .then((response) => {
          expect(response.body.message).toBe('Invalid email or password.');
        });
    });

    it('이메일이 누락된 경우 400 Bad Request를 반환해야 한다', async () => {
      const { email, ...invalidDto } = loginDto;
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBeInstanceOf(Array);
          const emailError = response.body.message.find(
            (err: any) => err.property === 'email',
          );
          expect(emailError).toBeDefined();
          if (emailError)
            expect(emailError.constraints.isNotEmpty).toBe(
              'email should not be empty',
            );
        });
    });
  });
});
