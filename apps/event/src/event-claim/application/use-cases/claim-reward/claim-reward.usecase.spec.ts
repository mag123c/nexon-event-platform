import { Test, TestingModule } from '@nestjs/testing';
import { Types, Connection, ClientSession } from 'mongoose';
import { ClaimRewardUseCase } from './claim-reward.usecase';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/event-core/domain/ports/event.repository';
import {
  REWARD_REPOSITORY,
  RewardRepository,
} from '@app/event/reward/domain/ports/reward.repository';
import {
  EVENT_CLAIM_REPOSITORY,
  EventClaimRepository,
} from '@app/event/event-claim/domain/event-claim/ports/event-claim.repository';
import { EVENT_CLAIM_FACTORY } from '@app/event/event-claim/domain/event-claim/factories/event-claim.factory';
import {
  USER_ACTIVITY_FETCHER,
  UserActivityFetcher,
} from '@app/event/event-core/application/ports/user-activity.fetcher';
import { EVENT_CONDITION_MATCHER_SERVICE } from '@app/event/event-core/application/ports/event-condition-matcher.service';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { Reward } from '@app/event/reward/domain/entities/reward.entity';
import {
  ClaimStatus,
  EventClaim,
} from '@app/event/event-claim/domain/event-claim/entities/event-claim.entity';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { EventClaimMongoFactory } from '@app/event/event-claim/infrastructure/factories/event-claim-mongo.factory';
import { EventConditionMatcherService } from '@app/event/event-core/application/services/event-condition-matcher.service';
import {
  AlreadyClaimedException,
  ConditionsNotMetException,
  EventNotClaimableException,
  EventNotFoundForClaimException,
  NoRewardsAvailableException,
} from '@app/event/event-claim/domain/event-claim/errors/event-claim.exception';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { ExternalServiceCommsException } from '@app/common/errors/external-service.exception';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';
import { ClaimRewardInput } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.inupt';
import { getConnectionToken } from '@nestjs/mongoose';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';

const mockEventRepo: jest.Mocked<EventRepository> = {
  findById: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
};
const mockRewardRepo: jest.Mocked<RewardRepository> = {
  findById: jest.fn(),
  findByEventIdAndName: jest.fn(),
  save: jest.fn(),
  findByEventId: jest.fn(),
  decreaseQuantity: jest.fn(),
};
const mockClaimRepo: jest.Mocked<EventClaimRepository> = {
  findById: jest.fn(),
  findSuccessfulClaim: jest.fn(),
  save: jest.fn(),
  saveInSession: jest.fn(),
};
const mockUserActivityFetcher: jest.Mocked<UserActivityFetcher> = {
  fetchByUserId: jest.fn(),
};

const mockSession: Partial<jest.Mocked<ClientSession>> = {
  withTransaction: jest.fn() as jest.MockedFunction<
    ClientSession['withTransaction']
  >,
  endSession: jest.fn().mockResolvedValue(undefined),
};

const mockMongoConnection: jest.Mocked<Connection> = {
  startSession: jest.fn().mockResolvedValue(mockSession),
} as any;

describe('ClaimRewardUseCase', () => {
  let useCase: ClaimRewardUseCase;

  const testUserId = new Types.ObjectId().toHexString();
  const testEventId = new Types.ObjectId();

  const mockActiveEvent = (): Event => {
    return {
      _id: testEventId,
      name: '활성 테스트 이벤트',
      status: EventStatus.ACTIVE,
      startDate: new Date(Date.now() - 1000 * 60 * 60),
      endDate: new Date(Date.now() + 1000 * 60 * 60),
      condition: {
        category: 'USER_ACTIVITY',
        type: 'LOGIN_STREAK_DAYS',
        operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 3,
      },
      createdBy: new Types.ObjectId(),
    } as Event;
  };

  const mockUserActivity = (
    overrides: Partial<UserActivityData> = {},
  ): UserActivityData => ({
    loginStreakDays: 5,
    ...overrides,
  });

  const mockReward = (
    idInput: string | Types.ObjectId,
    name: string,
    remaining: number | null,
  ): Reward => {
    return {
      _id: idInput,
      name: name,
      eventId: testEventId,
      type: 'MILEAGE',
      details: { amount: 100 },
      remainingQuantity: remaining === null ? null : remaining,
      quantity: remaining,
      createdBy: new Types.ObjectId(),
      createdAt: new Date(),
    } as Reward;
  };

  const getBaseInput = (): ClaimRewardInput => ({
    userId: testUserId,
    eventId: testEventId.toHexString(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockSession.withTransaction! as jest.Mock).mockImplementation(
      async (fn: (session: ClientSession) => Promise<any>) => {
        try {
          const result = await fn(mockSession as ClientSession);
          return result;
        } catch (error) {
          throw error;
        }
      },
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimRewardUseCase,
        { provide: EVENT_CLAIM_FACTORY, useClass: EventClaimMongoFactory },
        {
          provide: EVENT_CONDITION_MATCHER_SERVICE,
          useClass: EventConditionMatcherService,
        },
        { provide: EVENT_REPOSITORY, useValue: mockEventRepo },
        { provide: REWARD_REPOSITORY, useValue: mockRewardRepo },
        { provide: EVENT_CLAIM_REPOSITORY, useValue: mockClaimRepo },
        { provide: USER_ACTIVITY_FETCHER, useValue: mockUserActivityFetcher },
        {
          provide: getConnectionToken(MONGO_CONNECTIONS.EVENT),
          useValue: mockMongoConnection,
        },
      ],
    }).compile();

    useCase = module.get<ClaimRewardUseCase>(ClaimRewardUseCase);
  });

  describe('성공 시나리오', () => {
    it('모든 조건 충족 및 재고 있는 보상 지급 성공 시 SUCCESS 상태의 EventClaim 반환', async () => {
      const input = getBaseInput();
      const event = mockActiveEvent();
      event.condition = {
        category: 'USER_ACTIVITY',
        type: 'LOGIN_STREAK_DAYS',
        operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 3,
      } as any;
      const userActivity = mockUserActivity({ loginStreakDays: 5 });
      const reward1Id = new Types.ObjectId();
      const reward2Id = new Types.ObjectId();
      const reward1 = mockReward(reward1Id, '보상1', 10);
      const reward2 = mockReward(reward2Id, '보상2', null);

      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockResolvedValue(userActivity);
      mockRewardRepo.findByEventId.mockResolvedValue([reward1, reward2]);
      mockRewardRepo.decreaseQuantity.mockImplementation(
        async (id, amount, _session) => {
          if (id.toString() === reward1._id.toString()) {
            return {
              ...reward1,
              remainingQuantity: reward1.remainingQuantity! - amount,
            } as Reward;
          }
          return null;
        },
      );
      mockClaimRepo.saveInSession.mockImplementation(
        async (claimToSave) => claimToSave as any,
      );

      const result = await useCase.execute(input);

      expect(result.status).toBe(ClaimStatus.SUCCESS);
      expect(result.userId.toString()).toBe(input.userId);
      expect(result.eventId.toString()).toBe(input.eventId);
      expect(result.grantedRewards).toHaveLength(2);
      expect(
        result.grantedRewards.find((r) => r.rewardId.equals(reward1._id)),
      ).toBeDefined();
      expect(
        result.grantedRewards.find((r) => r.rewardId.equals(reward2._id)),
      ).toBeDefined();
      expect(mockRewardRepo.decreaseQuantity).toHaveBeenCalledWith(
        reward1._id.toHexString(),
        1,
        expect.anything(),
      );
      expect(mockClaimRepo.saveInSession).toHaveBeenCalledTimes(1);
      expect(mockMongoConnection.startSession).toHaveBeenCalledTimes(1);
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('조건 없는 이벤트에 대해 재고 있는 보상 지급 성공', async () => {
      const input = getBaseInput();
      const event = mockActiveEvent();
      event.condition = null as any; // 조건 없음
      const reward1Id = new Types.ObjectId();
      const reward1 = mockReward(reward1Id, '보상1', 1);

      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockResolvedValue(null);
      mockRewardRepo.findByEventId.mockResolvedValue([reward1]);
      mockRewardRepo.decreaseQuantity.mockResolvedValue({
        ...reward1,
        remainingQuantity: 0,
      } as Reward);
      mockClaimRepo.saveInSession.mockImplementation(
        async (claimToSave) => claimToSave as any,
      );

      const result = await useCase.execute(input);

      expect(result.status).toBe(ClaimStatus.SUCCESS);
      expect(result.grantedRewards).toHaveLength(1);
    });
  });

  describe('실패 시나리오 (예외 발생)', () => {
    it('이벤트 조회 실패 시 EventNotFoundForClaimException 발생', async () => {
      mockEventRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        EventNotFoundForClaimException,
      );
    });

    it('이벤트가 ACTIVE 상태가 아닐 시 EventNotClaimableException 발생 및 실패 기록', async () => {
      const event = mockActiveEvent();
      event.status = EventStatus.SCHEDULED;
      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.save.mockImplementation(
        async (claimToSave) => claimToSave as any,
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        EventNotClaimableException,
      );
      expect(mockClaimRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ClaimStatus.FAILED_EVENT_NOT_ACTIVE,
        }),
      );
    });

    it('이미 성공적으로 클레임한 경우 AlreadyClaimedException 발생', async () => {
      mockEventRepo.findById.mockResolvedValue(mockActiveEvent());
      const fakeExistingClaim = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(testUserId),
        eventId: testEventId,
        status: ClaimStatus.SUCCESS,
      } as EventClaim;
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(fakeExistingClaim);
      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        AlreadyClaimedException,
      );
    });

    it('유저 활동 데이터 조회 실패 시 ExternalServiceCommsException 발생 및 실패 기록', async () => {
      mockEventRepo.findById.mockResolvedValue(mockActiveEvent());
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockRejectedValue(
        new Error('TEST'),
      );
      mockClaimRepo.save.mockImplementation(
        async (claimToSave) => claimToSave as any,
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        ExternalServiceCommsException,
      );
      expect(mockClaimRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ClaimStatus.FAILED_UNKNOWN }),
      );
    });

    it('이벤트 조건 미충족 시 ConditionsNotMetException 발생 및 실패 기록', async () => {
      const event = mockActiveEvent();
      event.condition = {
        category: 'USER_ACTIVITY',
        type: 'LOGIN_STREAK_DAYS',
        operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 10,
      } as any;
      const userActivity = mockUserActivity({ loginStreakDays: 5 }); // 조건 미충족

      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockResolvedValue(userActivity);
      mockClaimRepo.save.mockImplementation(
        async (claimToSave) => claimToSave as any,
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        ConditionsNotMetException,
      );
      expect(mockClaimRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ClaimStatus.FAILED_CONDITIONS_NOT_MET,
        }),
      );
    });

    it('지급 가능한 보상이 하나도 없을 시 NoRewardsAvailableException 발생 (트랜잭션 후)', async () => {
      const event = mockActiveEvent();
      const rewardOutOfStockId = new Types.ObjectId();
      const rewardOutOfStock = mockReward(rewardOutOfStockId, '재고0보상', 0);

      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockResolvedValue(
        mockUserActivity(),
      );
      mockRewardRepo.findByEventId.mockResolvedValue([rewardOutOfStock]);
      mockRewardRepo.decreaseQuantity.mockResolvedValue(null);
      mockClaimRepo.saveInSession.mockImplementation(
        async (claimToSave, _session) => {
          claimToSave.status = ClaimStatus.FAILED_NO_REWARDS_AVAILABLE;
          return claimToSave as any;
        },
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        NoRewardsAvailableException,
      );
      expect(mockClaimRepo.saveInSession).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ClaimStatus.FAILED_NO_REWARDS_AVAILABLE,
        }),
        mockSession,
      );
    });

    it('트랜잭션 중 DB 오류 발생 시 DatabaseOperationException 발생', async () => {
      mockEventRepo.findById.mockResolvedValue(mockActiveEvent());
      mockClaimRepo.findSuccessfulClaim.mockResolvedValue(null);
      mockUserActivityFetcher.fetchByUserId.mockResolvedValue(
        mockUserActivity(),
      );

      const rewardIdForTxError = new Types.ObjectId();
      mockRewardRepo.findByEventId.mockResolvedValue([
        mockReward(rewardIdForTxError, 'r1', 10),
      ]);

      mockRewardRepo.decreaseQuantity.mockRejectedValue(
        new Error('Simulated DB error in transaction'),
      );

      (mockSession.withTransaction! as jest.Mock).mockImplementation(
        async (fn: (session: ClientSession) => Promise<any>) => {
          try {
            const result = await fn(mockSession as ClientSession);
            return result;
          } catch (error) {
            throw error;
          }
        },
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        DatabaseOperationException,
      );
    });
  });

  describe('recordFailedClaim 헬퍼 메소드 동작', () => {
    it('실패 기록 중 DB 오류 발생 시에도 주 흐름에 영향을 주지 않아야 한다 (예외 전파 X)', async () => {
      const event = mockActiveEvent();
      event.status = EventStatus.INACTIVE; // 실패 유도
      mockEventRepo.findById.mockResolvedValue(event);
      mockClaimRepo.save.mockRejectedValue(
        new Error('DB error during recordFailedClaim'),
      );

      await expect(useCase.execute(getBaseInput())).rejects.toThrow(
        EventNotClaimableException,
      );
    });
  });
});
