import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const accessTokenExpiresIn = configService.get<string>(
          'JWT_ACCESS_EXPIRATION',
        );

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        if (!accessTokenExpiresIn) {
          throw new Error(
            'JWT_ACCESS_EXPIRATION is not defined in environment variables',
          );
        }

        return {
          secret: secret,
          signOptions: {
            expiresIn: accessTokenExpiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [],
  exports: [JwtModule],
})
export class CommonJwtModule {}
