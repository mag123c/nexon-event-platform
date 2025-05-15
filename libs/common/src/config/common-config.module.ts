import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { isProduction } from 'libs/common/utils/env';

const envFilePath = isProduction() ? '.env' : '.env.development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envFilePath, '.env'],
    }),
  ],
  exports: [ConfigModule],
})
export class CommonConfigModule {}
