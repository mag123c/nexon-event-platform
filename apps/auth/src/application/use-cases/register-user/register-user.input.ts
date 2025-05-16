import { Role } from '@app/auth/domain/value-objects/role.vo';

export interface RegisterUserInput {
  email: string;
  password: string;
  roles?: Role[];
}
