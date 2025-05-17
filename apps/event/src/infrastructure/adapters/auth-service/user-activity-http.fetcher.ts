import { UserActivityData } from '@app/auth/domain/entities/user.entity';
import { ExternalServiceCommsException } from '@app/common/errors/external-service.exception';
import { UserActivityFetcher } from '@app/event/application/ports/user-activity.fetcher';
import { authServiceConfig } from '@app/event/config/services.config';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class UserActivityHttpFetcher implements UserActivityFetcher {
  private readonly logger = new Logger(UserActivityHttpFetcher.name);
  private readonly AUTH_SERVICE_URL: string;
  private readonly REQUEST_TIMEOUT = 5000;

  constructor(
    private readonly httpService: HttpService,
    @Inject(authServiceConfig.KEY)
    private readonly serviceConfig: ConfigType<typeof authServiceConfig>,
  ) {
    this.AUTH_SERVICE_URL = this.serviceConfig.url;
  }

  async fetchByUserId(
    userId: string,
    apiKey: string,
  ): Promise<UserActivityData | null> {
    const apiUrl = `${this.AUTH_SERVICE_URL}/users/${userId}/activity-data`;
    this.logger.log(`Requesting user activity data from: ${apiUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<UserActivityData>(apiUrl, {
            headers: { 'X-Internal-Api-Key': apiKey },
            timeout: this.REQUEST_TIMEOUT,
          })
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError((error) => {
              if (error instanceof TimeoutError) {
                this.logger.error(
                  `Timeout while fetching user activity data for userId ${userId} from ${apiUrl}`,
                  error.stack,
                );
                throw new ExternalServiceCommsException(
                  'Auth 서비스 응답 시간 초과',
                  { service: 'AuthService', cause: error },
                );
              }
              this.logger.error(
                `Error fetching user activity data for userId ${userId} from ${apiUrl}: ${error.response?.status} ${error.message}`,
                error.stack,
              );
              if (error.response?.status === 404) {
                // Auth 서버에서 유저를 못 찾은 경우 null 반환
                return Promise.resolve({ data: null } as any); // API 스펙에 따라 조정
              }
              throw new ExternalServiceCommsException(
                `Auth 서비스 통신 오류: ${error.message}`,
                {
                  service: 'AuthService',
                  status: error.response?.status,
                  cause: error,
                },
              );
            }),
          ),
      );

      if (response.status === 200) {
        this.logger.log(
          `Successfully fetched user activity data for userId ${userId}: ${JSON.stringify(response.data)}`,
        );
        return response.data;
      } else if (response.status === 404) {
        // 위 catchError에서 처리했지만, 이중 확인
        this.logger.warn(`User not found in Auth service for userId ${userId}`);
        return null;
      }
      // 기타 예상치 못한 상태 코드
      this.logger.error(
        `Unexpected response status ${response.status} from Auth service for userId ${userId}`,
      );
      throw new ExternalServiceCommsException(
        `Auth 서비스에서 예상치 못한 응답 상태: ${response.status}`,
        { service: 'AuthService', status: response.status },
      );
    } catch (error: any) {
      // 위에서 ExternalServiceCommsException으로 변환되지 않은 다른 예외들 (네트워크 오류 등)
      if (error instanceof ExternalServiceCommsException) throw error;

      this.logger.error(
        `Failed to fetch user activity data for userId ${userId}: ${error.message}`,
        error.stack,
      );
      throw new ExternalServiceCommsException(
        'Auth 서비스 통신 중 알 수 없는 오류 발생',
        { service: 'AuthService', cause: error },
      );
    }
  }
}
