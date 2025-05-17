import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import { Role } from '@app/auth/domain/value-objects/role.vo';

export interface InternalUserContext extends Omit<JwtPayload, 'email'> {}

export const InternalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): InternalUserContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers[CustomHeaders.USER_ID.toLowerCase()];
    const userRolesHeader =
      request.headers[CustomHeaders.USER_ROLES.toLowerCase()];

    if (!userId) {
      return undefined;
    }

    let roles: Role[] = [];
    if (userRolesHeader) {
      try {
        roles = JSON.parse(userRolesHeader as string);
      } catch (e) {
        console.warn('Failed to parse X-User-Roles header:', userRolesHeader);
      }
    }

    return {
      id: userId as string,
      roles,
    };
  },
);
