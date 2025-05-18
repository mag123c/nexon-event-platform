import { User } from '@app/auth/user/domain/entities/user.entity';
import { JwtPayload } from '@app/common/interfaces/jwt-payload.interface';

export interface TokenGeneratorPort {
  generateAccessToken(user: User): Promise<string>;
  generateRefreshToken(user: User): Promise<string>;
  verifyToken(token: string, secretKey: string): Promise<JwtPayload | null>;
}

export const TOKEN_GENERATOR_PORT = Symbol('TOKEN_GENERATOR_PORT');
