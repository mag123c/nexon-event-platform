import { Role } from 'libs/common/decorators/roles.decorator';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
