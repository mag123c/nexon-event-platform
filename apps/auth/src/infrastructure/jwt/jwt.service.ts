import { User } from '@app/auth/domain/entities/user.entity';
import { TokenGeneratorPort } from '@app/auth/domain/ports/token-generator.port';
import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService implements TokenGeneratorPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      id: user._id.toHexString(),
      email: user.email,
      roles: user.roles,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { id: user._id.toHexString() },
      { expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') },
    );
  }

  async verifyToken(
    token: string,
    secretKey: string,
  ): Promise<JwtPayload | null> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: secretKey,
      });
    } catch (error) {
      return null;
    }
  }
}
