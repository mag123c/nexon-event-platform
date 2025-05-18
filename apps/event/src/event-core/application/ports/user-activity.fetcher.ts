import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';

export const USER_ACTIVITY_FETCHER = Symbol('USER_ACTIVITY_FETCHER');

export interface UserActivityFetcher {
  /**
   * 특정 유저의 활동 데이터를 가져옵니다.
   * @param userId - 조회할 유저의 ID
   * @param apiKey - API 키 (인증을 위한)
   * @returns UserActivityData 또는 null (유저가 없거나 활동 데이터가 없는 경우)
   * @throws 외부 서비스 통신 오류 시 관련 예외
   */
  fetchByUserId(userId: string): Promise<UserActivityData | null>;
}
