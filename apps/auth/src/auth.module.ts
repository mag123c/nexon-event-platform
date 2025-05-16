import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.usecase';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { UserMongoRepository } from '@app/auth/infrastructure/persistence/user-mongo.repository';
import { HASHING_PORT } from '@app/auth/domain/ports/hasing.port';
import { Argon2Service } from '@app/auth/infrastructure/hasing/argon2.service';
import { User, UserSchema } from '@app/auth/domain/entities/user.entity';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { CommonConfigModule } from '@app/common/config/common-config.module';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { LoginUserUseCase } from '@app/auth/application/use-cases/login-user/login-user.usecase';
import { TOKEN_GENERATOR_PORT } from '@app/auth/domain/ports/token-generator.port';
import { JwtTokenService } from '@app/auth/infrastructure/jwt/jwt.service';
import { CommonJwtModule } from '@app/common/jwt/jwt-config.module';
import { JwtStrategy } from '@app/auth/infrastructure/strategy/jwt.strategy';

@Module({
  imports: [
    CommonConfigModule,
    CommonJwtModule,
    CommonMongooseModule.forRootAsync({
      configKey: 'AUTH_MONGODB_URI',
      connectionName: MONGO_CONNECTIONS.AUTH,
    }),
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      MONGO_CONNECTIONS.AUTH,
    ),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    {
      provide: HASHING_PORT,
      useClass: Argon2Service,
    },
    {
      provide: TOKEN_GENERATOR_PORT,
      useClass: JwtTokenService,
    },
  ],
})
export class AuthModule {}
