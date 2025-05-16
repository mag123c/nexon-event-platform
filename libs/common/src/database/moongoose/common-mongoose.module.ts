import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

export interface CommonMongooseModuleOptions {
  connectionName?: string;
  configKey: string;
}

@Module({})
export class CommonMongooseModule {
  static forRootAsync(options: CommonMongooseModuleOptions): DynamicModule {
    return {
      module: CommonMongooseModule,
      imports: [
        MongooseModule.forRootAsync({
          connectionName: options.connectionName,
          useFactory: async (configService: ConfigService) => {
            const uri = configService.get<string>(options.configKey);
            if (!uri) {
              throw new Error(
                `URI가 정의되지 않았습니다. configKey: ${options.configKey}`,
              );
            }
            return {
              uri,
            };
          },
          inject: [ConfigService],
        }),
      ],
      exports: [MongooseModule],
    };
  }
}
