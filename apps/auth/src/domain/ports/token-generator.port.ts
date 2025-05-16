import { User } from '@app/auth/domain/entities/user.entity';

export interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
}

export interface TokenGeneratorPort {
  generateAccessToken(user: User): Promise<string>;
  generateRefreshToken(user: User): Promise<string>;
  verifyToken(token: string, secretKey: string): Promise<JwtPayload | null>;
}

export const TOKEN_GENERATOR_PORT = Symbol('TOKEN_GENERATOR_PORT');
