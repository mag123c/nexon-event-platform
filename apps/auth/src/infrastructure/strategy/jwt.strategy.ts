import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { Inject } from '@nestjs/common';
import { User } from '@app/auth/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@app/auth/domain/ports/user.repository';
import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: [configService.get('JWT_ALGORITHM')!],
      secretOrKey: configService.get('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findById(payload.id);
    if (!user) {
      return null;
    }
    return user;
  }
}
