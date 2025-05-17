import { isProduction } from '@app/common/utils/env';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiInternalHeaders() {
  return applyDecorators(
    ApiHeader({
      name: CustomHeaders.INTERNAL_API_KEY,
      description: '게이트웨이로부터 전달받은 Internal API 인증 키',
      required: isProduction(),
    }),
    ApiHeader({
      name: CustomHeaders.USER_ID,
      description: '게이트웨이로부터 전달받은 사용자 ID',
      required: false,
    }),
    ApiHeader({
      name: CustomHeaders.USER_ROLES,
      description: '게이트웨이로부터 전달받은 사용자 역할 (JSON 문자열)',
      required: false,
    }),
  );
}
