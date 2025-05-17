import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '@app/auth/user/domain/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserDocument | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
