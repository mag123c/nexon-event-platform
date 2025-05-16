import { Role } from '@app/auth/domain/value-objects/role.vo';

export interface JwtPayload {
  id: string;
  email: string;
  roles: Role[];
}
