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

@Module({
  imports: [
    CommonConfigModule,
    CommonMongooseModule.forRootAsync({
      configKey: 'AUTH_MONGODB_URI',
      connectionName: 'auth',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    {
      provide: HASHING_PORT,
      useClass: Argon2Service,
    },
  ],
})
export class AuthModule {}
