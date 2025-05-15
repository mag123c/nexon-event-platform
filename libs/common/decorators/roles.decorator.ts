import { SetMetadata } from '@nestjs/common';

export type Role = 'USER' | 'ADMIN' | 'AUDITOR' | 'OPERATOR';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
