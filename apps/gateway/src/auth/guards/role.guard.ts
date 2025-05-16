// libs/common/src/guards/role.guard.ts (또는 apps/auth/src/presentation/guards/)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'; // ForbiddenException 추가
import { Reflector } from '@nestjs/core';
import { UserDocument } from '@app/auth/domain/entities/user.entity'; // 💡 UserDocument 타입 경로 확인
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { ROLES_KEY } from '@app/gateway/auth/decorators/roles.decorator';
import { ForbiddenRoleException } from '@app/common/errors/auth.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: UserDocument }>();
    const user = request.user;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenRoleException(
        requiredRoles,
        undefined,
        '사용자 역할 정보를 찾을 수 없습니다.',
      );
    }

    const hasRequiredRole = user.roles.some((userRole) =>
      requiredRoles.includes(userRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenRoleException(requiredRoles, user.roles);
    }

    return true;
  }
}
