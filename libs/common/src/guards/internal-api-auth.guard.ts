import { Role } from '@app/auth/domain/value-objects/role.vo';
import {
  MisconfiguredInternalApiAuthException,
  MissingInternalApiKeyException,
  InvalidInternalApiKeyException,
} from '@app/common/errors/internal-api-auth.exception';
import { isDevelopment } from '@app/common/utils/env';
import { CustomHeaders } from '@app/gateway/shared/constants/headers.constants';
import {
  Injectable,
  CanActivate,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class InternalApiAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiAuthGuard.name);
  private readonly expectedApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.expectedApiKey = this.configService.get<string>(
      'GATEWAY_INTERNAL_API_KEY',
    );
    if (!this.expectedApiKey) {
      this.logger.error(
        'FATAL: GATEWAY_INTERNAL_API_KEY is not configured for InternalApiAuthGuard. This is a security risk.',
      );
    }
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (isDevelopment()) {
      this.logger.warn(
        'Internal API Key is not configured in non-production environment.',
      );
      return true;
    }
    if (!this.expectedApiKey) {
      this.logger.error(
        'Internal API Key is not configured. Denying access due to misconfiguration.',
      );
      throw new MisconfiguredInternalApiAuthException();
    }

    const request = context.switchToHttp().getRequest();
    const apiKeyFromHeader =
      request.headers[CustomHeaders.INTERNAL_API_KEY.toLowerCase()];

    if (!apiKeyFromHeader) {
      this.logger.warn(
        `Missing ${CustomHeaders.INTERNAL_API_KEY} header. Access denied.`,
      );
      throw new MissingInternalApiKeyException();
    }

    if (apiKeyFromHeader !== this.expectedApiKey) {
      this.logger.warn(
        `Invalid ${CustomHeaders.INTERNAL_API_KEY} received. Access denied.`,
      );
      throw new InvalidInternalApiKeyException();
    }

    // API KEY가 유효한 경우, 사용자 ID와 역할을 설정합니다.
    const userId = request.headers[CustomHeaders.USER_ID.toLowerCase()];
    const rolesHeader = request.headers[CustomHeaders.USER_ROLES.toLowerCase()];

    if (userId) {
      let roles: Role[] = [];
      if (rolesHeader && typeof rolesHeader === 'string') {
        roles = rolesHeader
          .split(',')
          .map((role) => role.trim().toUpperCase() as Role);
      } else if (rolesHeader && Array.isArray(rolesHeader)) {
        roles = rolesHeader.map((role) => role.trim().toUpperCase() as Role);
      }
      request.user = { id: userId, roles: roles };
    } else {
      this.logger.warn(
        'Missing X-User-ID header, but Internal API Key was valid.',
      );
    }

    return true;
  }
}
