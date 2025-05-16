import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '@app/auth/domain/entities/user.entity';

/**
 * 요청 객체(request.user)에서 현재 인증된 사용자 정보를 추출하는 ParamDecorator.
 * JwtAuthGuard와 함께 사용되어야 합니다.
 * @param data - 데코레이터에 전달된 추가 데이터 (여기서는 사용 안 함)
 * @param context - 현재 실행 컨텍스트
 * @returns request.user에 담긴 Decoded JWT 정보
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserDocument | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
