import { Role } from '@app/auth/domain/value-objects/role.vo';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
