import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  JwtExpiredException,
  JwtUnauthorizedException,
} from '@app/common/errors/auth.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    info: Error | { message: string } | undefined,
  ) {
    if (
      (info && (info as Error).name === 'TokenExpiredError') ||
      (info as { message: string })?.message === 'jwt expired'
    ) {
      throw new JwtExpiredException();
    }

    // 에러 혹은 strategy에서 user를 찾지 못한 경우
    if (err || !user) {
      throw new JwtUnauthorizedException();
    }

    return user;
  }
}
