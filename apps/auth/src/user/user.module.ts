import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './presentation/controllers/user.controller';
import { UserMongoRepository } from '@app/auth/user/infrastructure/persistence/user-mongo.repository';
import { User, UserSchema } from '@app/auth/user/domain/entities/user.entity';
import { CommonMongooseModule } from '@app/common/database/moongoose/common-mongoose.module';
import { CommonConfigModule } from '@app/common/config/common-config.module';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { InternalApiAuthGuard } from '@app/common/guards/internal-api-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { USER_REPOSITORY } from '@app/auth/user/domain/ports/user.repository';

@Module({
  imports: [
    CommonConfigModule,
    CommonMongooseModule.forRootAsync({
      configKey: 'AUTH_MONGODB_URI',
      connectionName: MONGO_CONNECTIONS.AUTH,
    }),
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      MONGO_CONNECTIONS.AUTH,
    ),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    {
      provide: APP_GUARD,
      useClass: InternalApiAuthGuard,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
