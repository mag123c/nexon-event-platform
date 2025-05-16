import { AuthModule } from '@app/auth/auth.module';
import { UserDocument, User } from '@app/auth/domain/entities/user.entity';
import { HashingPort, HASHING_PORT } from '@app/auth/domain/ports/hasing.port';
import {
  UserRepository,
  USER_REPOSITORY,
} from '@app/auth/domain/ports/user.repository';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { HttpExceptionFilter, setupPipe } from '@app/common';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  Controller,
  Get,
  HttpStatus,
  INestApplication,
  UseGuards,
} from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { Connection, Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from '@app/auth/presentation/dtos/response/user.response.dto';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Roles } from '@app/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/common/guards/jwt.guard';
import { RolesGuard } from '@app/common/guards/role.guard';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('test-guard')
export class TestGuardController {
  @Get('jwt-protected')
  @UseGuards(JwtAuthGuard)
  getJwtProtectedResource(@CurrentUser() user: UserDocument): UserResponseDto {
    if (!user) {
      throw new Error('User not found in request after guard');
    }
    return UserResponseDto.fromEntity(user);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminOnlyResource(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Get('operator-or-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  getOperatorOrAdminResource(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Get('user-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  getUserOnlyResource(@CurrentUser() user: UserDocument) {
    return user;
  }
}

describe('Guards (E2E with testcontroller)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let userRepository: UserRepository;
  let userModel: Model<UserDocument>;
  let hashingService: HashingPort;
  let testUser: UserDocument;
  let validAccessToken: string;

  const AUTH_DB_CONNECTION_NAME = MONGO_CONNECTIONS.AUTH;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [TestGuardController],
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

    const testUserData = {
      email: 'guard-test-user@example.com',
      password: 'securePassword123',
      roles: [Role.USER],
    };

    await userModel.deleteMany({});
    const hashedPassword = await hashingService.hash(testUserData.password);
    testUser = await userModel.create({
      email: testUserData.email,
      password: hashedPassword,
      roles: testUserData.roles,
    });

    // Access Token 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserData.email, password: testUserData.password });

    if (
      loginResponse.status !== HttpStatus.OK ||
      !loginResponse.body.accessToken
    ) {
      console.error(
        'E2E Test Setup Error: 엑세스토큰 발급 실패',
        loginResponse.body,
      );
      throw new Error('E2E Test Setup Error: 엑세스토큰 발급 실패');
    }
    validAccessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await dbConnection?.close();
    await app.close();
  });

  describe('GET /test-guard/jwt-protected - 테스트용 임시 컨트롤러로 테스트', () => {
    it('유효한 JWT 토큰으로 요청 시 200 OK와 사용자 정보를 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-guard/jwt-protected')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testUser._id.toHexString());
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.roles).toEqual(testUser.roles);
    });

    it('JWT 토큰 없이 요청 시 401 Unauthorized를 반환해야 한다', async () => {
      return request(app.getHttpServer())
        .get('/test-guard/jwt-protected')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('잘못된 형식의 JWT 토큰으로 요청 시 401 Unauthorized를 반환해야 한다', async () => {
      const invalidToken = 'Bearer ThisIsAnInvalidToken';
      return request(app.getHttpServer())
        .get('/test-guard/jwt-protected')
        .set('Authorization', invalidToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('만료된 JWT 토큰으로 요청 시 401 Unauthorized를 반환해야 한다 (JwtExpiredException)', async () => {
      const jwtService = moduleFixture.get<JwtService>(JwtService);
      const configService = moduleFixture.get<ConfigService>(ConfigService);
      const expiredTokenPayload = {
        sub: testUser._id.toHexString(),
        email: testUser.email,
        roles: testUser.roles,
      };
      const expiredToken = jwtService.sign(expiredTokenPayload, {
        secret: configService.get<string>('JWT_SECRET'),
        expiresIn: '0s', // 즉시 만료
      });

      return request(app.getHttpServer())
        .get('/test-guard/jwt-protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // apps/auth/test/guards.e2e.spec.ts

  // ... (imports 및 describe 상단 부분은 동일) ...

  describe('Guards test', () => {
    const processChangeRolesAndToken = async (
      userId: Types.ObjectId | string,
      newRoles: Role[],
    ) => {
      await userModel
        .findByIdAndUpdate(userId, { $set: { roles: newRoles } }, { new: true })
        .exec();

      const updatedUserFromDb = await userModel.findById(userId).lean();
      if (!updatedUserFromDb) {
        throw new Error(`User with id ${userId} not found after role update.`);
      }

      const jwtService = moduleFixture.get<JwtService>(JwtService);
      const configService = moduleFixture.get<ConfigService>(ConfigService);
      const payload = {
        id: updatedUserFromDb._id.toHexString(),
        email: updatedUserFromDb.email,
        roles: updatedUserFromDb.roles,
      };
      const token = jwtService.sign(payload, {
        secret: configService.get<string>('JWT_SECRET'),
        expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION'),
      });
      return { updatedUser: updatedUserFromDb as UserDocument, token };
    };

    let baseTestUserForRoles: UserDocument;
    const baseTestUserEmail = 'roles-base-user@example.com';

    beforeAll(async () => {
      await userModel.deleteMany({ email: baseTestUserEmail });
      const hashedPassword = await hashingService.hash('roleTestPass');
      baseTestUserForRoles = await userModel.create({
        email: baseTestUserEmail,
        password: hashedPassword,
        name: 'Roles Base User',
        roles: [Role.USER], // 초기 역할은 USER
      });
    });

    describe('GET /test-guard/admin-only', () => {
      it('ADMIN 역할 사용자가 접근 시 200 OK를 반환해야 한다', async () => {
        const { token: adminUserToken, updatedUser } =
          await processChangeRolesAndToken(baseTestUserForRoles._id, [
            Role.ADMIN,
            Role.USER,
          ]);
        expect(updatedUser.roles).toContain(Role.ADMIN);

        return request(app.getHttpServer())
          .get('/test-guard/admin-only')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body._id).toBe(
              baseTestUserForRoles._id.toHexString(),
            );
            expect(response.body.roles).toContain(Role.ADMIN);
          });
      });

      it('USER 역할 사용자가 접근 시 403 Forbidden을 반환해야 한다', async () => {
        const { token: regularUserToken } = await processChangeRolesAndToken(
          baseTestUserForRoles._id,
          [Role.USER],
        );

        return request(app.getHttpServer())
          .get('/test-guard/admin-only')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('OPERATOR 역할 사용자가 접근 시 403 Forbidden을 반환해야 한다', async () => {
        const { token: operatorUserToken } = await processChangeRolesAndToken(
          baseTestUserForRoles._id,
          [Role.OPERATOR],
        );

        return request(app.getHttpServer())
          .get('/test-guard/admin-only')
          .set('Authorization', `Bearer ${operatorUserToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('GET /test-guard/operator-or-admin (Requires OPERATOR or ADMIN role)', () => {
      it('ADMIN 역할 사용자가 접근 시 200 OK를 반환해야 한다', async () => {
        const { token: adminUserToken } = await processChangeRolesAndToken(
          baseTestUserForRoles._id,
          [Role.ADMIN],
        );

        return request(app.getHttpServer())
          .get('/test-guard/operator-or-admin')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .expect(HttpStatus.OK);
      });

      it('OPERATOR 역할 사용자가 접근 시 200 OK를 반환해야 한다', async () => {
        const { token: operatorUserToken } = await processChangeRolesAndToken(
          baseTestUserForRoles._id,
          [Role.OPERATOR],
        );

        return request(app.getHttpServer())
          .get('/test-guard/operator-or-admin')
          .set('Authorization', `Bearer ${operatorUserToken}`)
          .expect(HttpStatus.OK);
      });

      it('USER 역할 사용자가 접근 시 403 Forbidden을 반환해야 한다', async () => {
        const { token: regularUserToken } = await processChangeRolesAndToken(
          baseTestUserForRoles._id,
          [Role.USER],
        );

        return request(app.getHttpServer())
          .get('/test-guard/operator-or-admin')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    it('토큰 없이 역할 보호된 API 접근 시 401 Unauthorized를 반환해야 한다 (JwtAuthGuard가 먼저 차단)', async () => {
      return request(app.getHttpServer())
        .get('/test-guard/admin-only')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
