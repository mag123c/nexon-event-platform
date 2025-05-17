import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.usecase';
import { HASHING_PORT } from '@app/auth/domain/ports/hasing.port';
import { Argon2Service } from '@app/auth/infrastructure/hasing/argon2.service';
import { CommonConfigModule } from '@app/common/config/common-config.module';
import { LoginUserUseCase } from '@app/auth/application/use-cases/login-user/login-user.usecase';
import { TOKEN_GENERATOR_PORT } from '@app/auth/domain/ports/token-generator.port';
import { JwtTokenService } from '@app/auth/infrastructure/jwt/jwt.service';
import { CommonJwtModule } from '@app/common/jwt/jwt-config.module';
import { InternalApiAuthGuard } from '@app/common/guards/internal-api-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from '@app/auth/user/user.module';

@Module({
  imports: [CommonConfigModule, CommonJwtModule, UserModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    {
      provide: HASHING_PORT,
      useClass: Argon2Service,
    },
    {
      provide: TOKEN_GENERATOR_PORT,
      useClass: JwtTokenService,
    },
    {
      provide: APP_GUARD,
      useClass: InternalApiAuthGuard,
    },
  ],
})
export class AuthModule {}
