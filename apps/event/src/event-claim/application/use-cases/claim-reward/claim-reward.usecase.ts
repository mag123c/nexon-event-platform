import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';
import { BaseError } from '@app/common';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { ExternalServiceCommsException } from '@app/common/errors/external-service.exception';
import {
  EVENT_CONDITION_MATCHER_SERVICE,
  EventConditionMatchDetail,
  EventConditionMatchResult,
} from '@app/event/event-core/application/ports/event-condition-matcher.service';
import {
  USER_ACTIVITY_FETCHER,
  UserActivityFetcher,
} from '@app/event/event-core/application/ports/user-activity.fetcher';
import { EventConditionMatcherService } from '@app/event/event-core/application/services/event-condition-matcher.service';
import { ClaimRewardInput } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.inupt';
import {
  EventClaim,
  ClaimStatus,
} from '@app/event/event-claim/domain/event-claim/entities/event-claim.entity';
import {
  AlreadyClaimedException,
  ConditionsNotMetException,
  EventNotClaimableException,
  EventNotFoundForClaimException,
  NoRewardsAvailableException,
} from '@app/event/event-claim/domain/event-claim/errors/event-claim.exception';
import {
  CreateEventClaimParams,
  EVENT_CLAIM_FACTORY,
  EventClaimFactory,
} from '@app/event/event-claim/domain/event-claim/factories/event-claim.factory';
import {
  EVENT_CLAIM_REPOSITORY,
  EventClaimRepository,
} from '@app/event/event-claim/domain/event-claim/ports/event-claim.repository';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/event-core/domain/ports/event.repository';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import {
  REWARD_REPOSITORY,
  RewardRepository,
} from '@app/event/reward/domain/ports/reward.repository';
import { Injectable, Logger, Inject, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

@Injectable()
export class ClaimRewardUseCase {
  private readonly logger = new Logger(ClaimRewardUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: RewardRepository,
    @Inject(EVENT_CLAIM_REPOSITORY)
    private readonly eventClaimRepository: EventClaimRepository,
    @Inject(EVENT_CLAIM_FACTORY)
    private readonly eventClaimFactory: EventClaimFactory,

    // Auth 서버 등에서 유저 활동 데이터 가져오기
    @Inject(USER_ACTIVITY_FETCHER)
    private readonly userActivityFetcher: UserActivityFetcher,

    // 이벤트 조건 매칭 서비스
    @Inject(EVENT_CONDITION_MATCHER_SERVICE)
    private readonly conditionMatcher: EventConditionMatcherService,

    // 트랜잭션 Connection
    @InjectConnection(MONGO_CONNECTIONS.EVENT)
    private readonly mongoConnection: Connection,
  ) {}

  /**
   * @description 사용자의 이벤트 보상 요청을 처리합니다. 이벤트 유효성, 중복 요청, 조건 충족 여부를 검사하고,
   *              조건 충족 시 트랜잭션 내에서 보상 재고를 차감하고 클레임 기록을 생성합니다.
   * @param input - 보상 요청을 위한 입력 데이터 (userId, eventId, internalApiKey 등)
   * @returns 생성 또는 업데이트된 EventClaim 객체 (성공, 실패 상태 포함)
   * @throws EventNotFoundForClaimException - 요청한 eventId의 이벤트를 찾을 수 없는 경우
   * @throws EventNotClaimableException - 이벤트가 ACTIVE 상태가 아니거나 기간이 아닌 경우
   * @throws AlreadyClaimedException - 사용자가 이미 해당 이벤트의 보상을 성공적으로 지급받은 경우
   * @throws ExternalServiceCommsException - 유저 활동 데이터 조회 중 외부 서비스(Auth) 통신 오류 발생 시
   * @throws ConditionsNotMetException - 유저 활동 데이터가 없거나 이벤트 조건을 충족하지 못한 경우
   * @throws NoRewardsAvailableException - 지급 가능한 보상이 하나도 없는 경우 (모두 소진 등)
   * @throws DatabaseOperationException - 데이터베이스 작업 중 예측하지 못한 오류 발생 시
   */
  async execute(input: ClaimRewardInput): Promise<EventClaim> {
    this.logger.log(
      `[EXECUTE] 보상 신청 요청: userId=${input.userId}, eventId=${input.eventId}`,
    );

    // 1. 이벤트 유효성 검사 (실패 시 기록 및 예외 발생)
    const event = await this.getValidEventOrThrow(input);

    // 2. 중복 클레임 검사 (실패 시 예외 발생)
    await this.ensureNotAlreadyClaimed(input.userId, input.eventId);

    // 3. 유저 활동 데이터 조회 (실패 시 기록 및 예외 발생)
    const userActivity = await this.fetchUserActivityOrThrow(input);
    this.logger.log('UESRACTIVITY', userActivity);

    const conditionMatchResult = this.validateEventCondition(
      input,
      event,
      userActivity,
    );

    // 4. 이벤트 조건 검사 (실패 시 기록 및 예외 발생)
    if (!conditionMatchResult.allConditionsMet) {
      const failureReason = '이벤트 조건을 충족하지 못했습니다.';
      const logDetails = this.formatConditionLogDetails(conditionMatchResult);
      this.logger.warn(
        `[EXECUTE] 이벤트 조건 미충족: userId=${input.userId}, eventId=${input.eventId}, details=${logDetails}`,
      );
      await this.recordFailedClaim(
        input,
        ClaimStatus.FAILED_CONDITIONS_NOT_MET,
        failureReason,
        conditionMatchResult.checkDetail,
      );
      throw new ConditionsNotMetException(input.eventId, logDetails);
    }

    // 5. 트랜잭션 내에서 보상 지급 처리
    const savedClaim = await this.processClaimInTransaction(
      input,
      event,
      conditionMatchResult,
    );

    // 6. 지급 가능한 보상이 없는 경우 (실패 상태 기록)
    if (savedClaim.status === ClaimStatus.FAILED_NO_REWARDS_AVAILABLE) {
      throw new NoRewardsAvailableException(input.eventId);
    }

    this.logger.log(
      `[EXECUTE] 보상 신청 완료: userId=${input.userId}, eventId=${input.eventId}, claimId=${savedClaim._id}`,
    );
    return savedClaim;
  }

  /**
   * @description 이벤트 유효성 검사 및 예외 처리
   * @param input - 보상 요청을 위한 입력 데이터 (userId, eventId 등)
   * @returns 유효한 Event 객체
   */
  private async getValidEventOrThrow(input: ClaimRewardInput): Promise<Event> {
    try {
      return await this.validateEventEligibility(input.eventId);
    } catch (error) {
      if (error instanceof EventNotFoundForClaimException) {
        this.logger.warn(
          `[_getValidEventOrThrow] 이벤트 찾기 실패: eventId=${input.eventId}, error=${error.message}`,
        );
      } else if (error instanceof EventNotClaimableException) {
        this.logger.warn(
          `[_getValidEventOrThrow] 이벤트 요청 불가: eventId=${input.eventId}, error=${error.message}`,
        );
        await this.recordFailedClaim(
          input,
          error.message.includes('ACTIVE가 아님')
            ? ClaimStatus.FAILED_EVENT_NOT_ACTIVE
            : ClaimStatus.FAILED_EVENT_EXPIRED,
          error.message,
        );
      }
      throw error;
    }
  }

  /**
   * @description 유저 활동 데이터 조회 및 예외 처리
   * @param input - 보상 요청을 위한 입력 데이터 (userId 등)
   * @returns 유저 활동 데이터
   */
  private async fetchUserActivityOrThrow(
    input: ClaimRewardInput,
  ): Promise<UserActivityData | null> {
    try {
      return await this.fetchUserActivity(input);
    } catch (error: any) {
      this.logger.error(
        `[_fetchUserActivityOrThrow] 사용자 활동 데이터 가져오기 실패: userId=${input.userId}, error=${error.message}`,
        (error as Error).stack,
      );
      const failureReason =
        error instanceof Error
          ? error.message
          : '유저 활동 데이터 조회 중 알 수 없는 오류';
      await this.recordFailedClaim(
        input,
        ClaimStatus.FAILED_UNKNOWN,
        `유저 활동 데이터 조회 실패: ${failureReason}`,
      );
      throw error;
    }
  }

  private async validateEventEligibility(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      this.logger.warn(
        `[validateEventEligibility] 이벤트를 찾을 수 없음: eventId=${eventId}`,
      );
      throw new EventNotFoundForClaimException(eventId);
    }

    const now = new Date();
    if (event.status !== EventStatus.ACTIVE) {
      const reason = `이벤트 상태가 ACTIVE가 아님 (현재: ${event.status})`;
      this.logger.warn(
        `[validateEventEligibility] ${reason}, eventId=${eventId}`,
      );
      throw new EventNotClaimableException(eventId, reason);
    }
    if (now < event.startDate || now > event.endDate) {
      const reason = `이벤트 기간이 아님 (시작: ${event.startDate}, 종료: ${event.endDate})`;
      this.logger.warn(
        `[validateEventEligibility] ${reason}, eventId=${eventId}`,
      );
      throw new EventNotClaimableException(eventId, reason);
    }
    return event;
  }

  private async ensureNotAlreadyClaimed(
    userId: string,
    eventId: string,
  ): Promise<void> {
    const existingClaim = await this.eventClaimRepository.findSuccessfulClaim(
      userId,
      eventId,
    );
    if (existingClaim) {
      this.logger.warn(
        `[ensureNotAlreadyClaimed] 이미 보상 신청이 존재함: userId=${userId}, eventId=${eventId}, claimId=${existingClaim._id}`,
      );
      throw new AlreadyClaimedException(userId, eventId);
    }
  }

  private async fetchUserActivity({
    userId,
  }: ClaimRewardInput): Promise<UserActivityData | null> {
    try {
      return await this.userActivityFetcher.fetchByUserId(userId);
    } catch (error: any) {
      this.logger.error(
        `[fetchUserActivity] 사용자 활동 데이터 가져오기 실패: userId=${userId}, error=${error.message}`,
        error.stack,
      );
      let userMessage = '사용자 정보를 가져오는 중 오류가 발생했습니다.';
      if (
        error instanceof ExternalServiceCommsException &&
        error.details.originalStatus === HttpStatus.NOT_FOUND
      ) {
        userMessage = '사용자 정보를 찾을 수 없습니다.';
      }
      // 실패 기록은 execute 메소드에서 할 것이므로, 여기서는 변환된 예외만 throw
      throw new ExternalServiceCommsException(
        `유저 활동 데이터 조회 실패 (userId: ${userId})`,
        { service: 'AuthService', cause: error, description: userMessage },
        error instanceof ExternalServiceCommsException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validateEventCondition(
    input: ClaimRewardInput,
    event: Event,
    userActivity: UserActivityData | null,
  ): EventConditionMatchResult {
    if (!event.condition) {
      this.logger.log(
        `[validateEventCondition] 이벤트에 조건 없음: eventId=${event._id}`,
      );
      return {
        allConditionsMet: true,
        checkDetail: {
          conditionDefinition: null as any, // 없다고 가정
          conditionType: 'NO_CONDITION',
          targetValue: null,
          actualValue: null,
          isMet: true,
          checkedAt: new Date(),
          message: '이벤트에 설정된 조건 없음',
        },
      };
    }

    if (!userActivity) {
      // 조건은 있는데 유저 활동 데이터가 아예 없는 경우
      this.logger.warn(
        `[validateEventConditions] 유저 활동 데이터 없음: userId=${input.userId}, eventId=${event._id}`,
      );
      const detail: EventConditionMatchDetail = {
        conditionDefinition: event.condition,
        conditionType: `${event.condition.category}_${event.condition.type}`,
        targetValue: event.condition.value,
        actualValue: null,
        isMet: false,
        checkedAt: new Date(),
        message: '유저 활동 데이터 없음',
      };

      return { allConditionsMet: false, checkDetail: detail };
    }
    return this.conditionMatcher.match(event.condition, userActivity || {});
  }

  private formatConditionLogDetails(result: EventConditionMatchResult): string {
    return `${result.checkDetail.conditionType}(target:${result.checkDetail.targetValue},actual:${result.checkDetail.actualValue}):${result.checkDetail.isMet}`;
  }

  private async processClaimInTransaction(
    input: ClaimRewardInput,
    event: Event,
    conditionMatchResult: EventConditionMatchResult,
  ): Promise<EventClaim> {
    const session = await this.mongoConnection.startSession();
    this.logger.debug(
      `[processClaimInTransaction] 트랜잭션 시작: userId=${input.userId}, eventId=${event._id}`,
    );
    try {
      let savedClaimInTransaction: EventClaim | undefined;

      await session.withTransaction(async (currentSession: ClientSession) => {
        const allRewards = await this.rewardRepository.findByEventId(
          event._id.toHexString(),
        );
        const grantedRewardSnapshots: CreateEventClaimParams['eligibleRewardsSnapshots'] =
          [];

        for (const reward of allRewards) {
          let grantedThisReward = false;
          if (reward.remainingQuantity === null) {
            this.logger.debug(`[TX] Reward [${reward.name}] is unlimited.`);
            grantedThisReward = true;
          } else if (
            reward.remainingQuantity !== undefined &&
            reward.remainingQuantity > 0
          ) {
            const updated = await this.rewardRepository.decreaseQuantity(
              reward._id.toHexString(),
              1,
              currentSession,
            );
            if (updated) {
              this.logger.debug(
                `[TX] Reward [${updated.name}] quantity decreased. Remaining: ${updated.remainingQuantity}`,
              );
              grantedThisReward = true;
            } else {
              this.logger.warn(
                `[TX] Reward [${reward.name}] quantity decrease failed. Out of stock.`,
              );
            }
          } else {
            this.logger.warn(
              `[TX] Reward [${reward.name}] is out of stock or not applicable.`,
            );
          }

          if (grantedThisReward) {
            grantedRewardSnapshots.push({
              rewardId: reward._id,
              name: reward.name,
              type: reward.type,
              details: reward.details,
            });
          }
        }

        const finalStatus =
          grantedRewardSnapshots.length > 0
            ? ClaimStatus.SUCCESS
            : ClaimStatus.FAILED_NO_REWARDS_AVAILABLE;
        const failureReason =
          finalStatus === ClaimStatus.FAILED_NO_REWARDS_AVAILABLE
            ? '지급 가능한 보상이 모두 소진되었거나 대상이 아닙니다.'
            : undefined;
        this.logger.log(
          `[TX] 보상 신청 처리 결과: userId=${input.userId}, eventId=${event._id}, status=${finalStatus}`,
        );

        const claimParams: CreateEventClaimParams = {
          userId: input.userId,
          eventId: event._id.toHexString(),
          status: finalStatus,
          eligibleRewardsSnapshots: grantedRewardSnapshots,
          conditionCheckResult: conditionMatchResult.checkDetail,
          failureReason: failureReason,
          processedAt: new Date(),
        };
        const newClaim = this.eventClaimFactory.create(claimParams);
        savedClaimInTransaction = await this.eventClaimRepository.saveInSession(
          newClaim,
          currentSession,
        );
      });

      if (!savedClaimInTransaction) {
        // 인지하지 못한 예외상황
        this.logger.error(
          '[processClaimInTransaction] 트랜잭션 내에서 클레임 저장 실패',
        );
        throw new DatabaseOperationException(
          '트랜잭션 처리 후 클레임 정보를 가져오지 못했습니다.',
        );
      }

      return savedClaimInTransaction;
    } catch (error: any) {
      this.logger.error(
        `[processClaimInTransaction] 트랜잭션 중 오류 발생: userId=${input.userId}, eventId=${event._id}, error=${error.message}`,
        error.stack,
      );
      if (error instanceof BaseError) {
        throw error;
      }
      throw new DatabaseOperationException(
        '보상 요청 처리 중 데이터베이스 오류가 발생했습니다.',
        error,
      );
    } finally {
      await session.endSession();
      this.logger.debug(
        `[processClaimInTransaction] Session ended for userId=${input.userId}, eventId=${event._id}`,
      );
    }
  }
  /**
   * @description 클레임 요청이 실패했을 때, 실패 사유와 함께 클레임 기록을 남기는 메소드.
   *              실패 사유는 간단한 문자열로 기록되며, 조건 검증 결과도 함께 저장됩니다.
   */
  private async recordFailedClaim(
    input: ClaimRewardInput,
    status: ClaimStatus,
    failureReason: string,
    conditionDetail?: EventConditionMatchDetail,
  ): Promise<void> {
    this.logger.log(
      `[recordFailedClaim] 실패 클레임 기록 시도: userId=${input.userId}, eventId=${input.eventId}, status=${status}, reason=${failureReason}`,
    );
    try {
      const claimParams: CreateEventClaimParams = {
        userId: input.userId,
        eventId: input.eventId,
        status: status,
        eligibleRewardsSnapshots: [],
        conditionCheckResult: conditionDetail,
        failureReason: failureReason,
        processedAt: new Date(),
      };
      const failedClaim = this.eventClaimFactory.create(claimParams);
      await this.eventClaimRepository.save(failedClaim);
      this.logger.log(
        `[recordFailedClaim] 실패 클레임 기록 완료: claimId=${failedClaim._id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[recordFailedClaim] 실패 클레임 기록 중 오류 발생: ${error.message}`,
        error.stack,
      );
    }
  }
}
