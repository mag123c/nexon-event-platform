import { Role } from '@app/auth/domain/value-objects/role.vo';
import {
  ForbiddenRoleException,
  HttpExceptionFilter,
  JwtExpiredException,
  JwtUnauthorizedException,
  setupPipe,
} from '@app/common';
import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';
import { AppModule } from '@app/gateway/app.module';
import { CurrentUser } from '@app/gateway/auth/decorators/current-user.decorator';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/gateway/auth/guards/jwt.guard';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import {
  INestApplication,
  HttpStatus,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

@Controller('test-gateway-guards')
class TestGatewayGuardController {
  @Get('jwt-protected')
  @UseGuards(JwtAuthGuard)
  getJwtProtectedResource(@CurrentUser() user: JwtPayload) {
    if (!user)
      throw new Error('테스트 오류: JWT 가드 통과 후 사용자 정보 없음');
    return { userId: user.id, email: user.email, roles: user.roles };
  }

  @Post('role-protected-operator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR)
  getOperatorResource(@CurrentUser() user: JwtPayload) {
    return { message: '오퍼레이터 리소스 접근 성공', userRoles: user.roles };
  }

  @Post('role-protected-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminResource(@CurrentUser() user: JwtPayload) {
    return { message: '어드민 리소스 접근 성공', userRoles: user.roles };
  }
}

describe('게이트웨이 E2E - 인증 및 인가 테스트', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  const createTestPayload = (
    id: string,
    email: string,
    roles: Role[],
  ): JwtPayload => ({
    id,
    email,
    roles,
  });

  const generateTestToken = (
    payload: JwtPayload,
    expiresIn: string = '15m',
  ) => {
    return jwtService.sign(payload, {
      secret: configService.get<string>('JWT_SECRET'),
      expiresIn,
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestGatewayGuardController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    setupPipe(app);
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT 인증 테스트 (@UseGuards(JwtAuthGuard))', () => {
    const testUser = createTestPayload('user-123', 'jwt-test@example.com', [
      Role.USER,
    ]);
    const protectedPath = '/api/v1/test-gateway-guards/jwt-protected';

    it('유효한 JWT 토큰으로 요청 시 200 OK와 사용자 정보를 반환해야 한다', async () => {
      const token = generateTestToken(testUser);
      const response = await request(app.getHttpServer())
        .get(protectedPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.roles).toEqual(testUser.roles);
    });

    it('JWT 토큰 없이 요청 시 401 Unauthorized를 반환해야 한다 (JwtAuthGuard)', async () => {
      return request(app.getHttpServer())
        .get(protectedPath)
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).toBe(new JwtUnauthorizedException().message);
        });
    });

    it('만료된 JWT 토큰으로 요청 시 401 Unauthorized를 반환해야 한다 (JwtExpiredException)', async () => {
      const token = generateTestToken(testUser, '0s');
      return request(app.getHttpServer())
        .get(protectedPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).toBe(new JwtExpiredException().message);
        });
    });
  });

  describe('역할 기반 인가 테스트 (@UseGuards(JwtAuthGuard, RolesGuard) @Roles(...))', () => {
    const operatorUser = createTestPayload('op-123', 'operator@example.com', [
      Role.OPERATOR,
    ]);
    const adminUser = createTestPayload('admin-123', 'admin@example.com', [
      Role.ADMIN,
    ]);
    const normalUser = createTestPayload('user-456', 'user@example.com', [
      Role.USER,
    ]);

    const operatorPath = '/api/v1/test-gateway-guards/role-protected-operator';
    const adminPath = '/api/v1/test-gateway-guards/role-protected-admin';

    it('OPERATOR 역할 사용자가 OPERATOR 리소스에 접근 시 201 Created를 반환해야 한다', async () => {
      const token = generateTestToken(operatorUser);
      const response = await request(app.getHttpServer())
        .post(operatorPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      expect(response.body.message).toBe('오퍼레이터 리소스 접근 성공');
    });

    it('ADMIN 역할 사용자가 ADMIN 리소스에 접근 시 201 Created를 반환해야 한다', async () => {
      const token = generateTestToken(adminUser);
      const response = await request(app.getHttpServer())
        .post(adminPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.CREATED);

      expect(response.body.message).toBe('어드민 리소스 접근 성공');
    });

    it('USER 역할 사용자가 OPERATOR 리소스에 접근 시 403 Forbidden을 반환해야 한다', async () => {
      const token = generateTestToken(normalUser);
      return request(app.getHttpServer())
        .post(operatorPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.message).toBe(new ForbiddenRoleException().message);
          expect(res.body.extra.requiredRoles).toEqual([Role.OPERATOR]);
          expect(res.body.extra.userRoles).toEqual([Role.USER]);
        });
    });

    it('OPERATOR 역할 사용자가 ADMIN 리소스에 접근 시 403 Forbidden을 반환해야 한다', async () => {
      const token = generateTestToken(operatorUser);
      return request(app.getHttpServer())
        .post(adminPath)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
        .then((res) => {
          expect(res.body.message).toBe(new ForbiddenRoleException().message);
          expect(res.body.extra.requiredRoles).toEqual([Role.ADMIN]);
          expect(res.body.extra.userRoles).toEqual([Role.OPERATOR]);
        });
    });
  });
});
