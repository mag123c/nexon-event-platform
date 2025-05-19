import { Role } from '@app/auth/domain/value-objects/role.vo';
import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';

export interface RegisterUserInput {
  email: string;
  password: string;
  roles?: Role[];
  userActivity?: UserActivityData;
}
