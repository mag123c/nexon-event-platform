import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { RewardDetailsValidatorService } from '@app/event/application/services/reward-details-validator.service';
import { CreateRewardInput } from '@app/event/application/use-cases/create-reward/create-reward.input';
import { CreateRewardUseCase } from '@app/event/application/use-cases/create-reward/create-reward.usecase';
import {
  Event,
  EventDocument,
} from '@app/event/domain/event/entities/event.entity';
import {
  EventRepository,
  EVENT_REPOSITORY,
} from '@app/event/domain/event/ports/event.repository';
import {
  MileageRewardDetails,
  Reward,
  RewardDocument,
} from '@app/event/domain/reward/entities/reward.entity';
import {
  EventNotFoundForRewardException,
  InvalidRewardDetailsException,
  InvalidRewardQuantityException,
  RewardAlreadyExistsInEventException,
} from '@app/event/domain/reward/errors/reward.exception';
import { REWARD_FACTORY } from '@app/event/domain/reward/factories/reward.factory';
import {
  RewardRepository,
  REWARD_REPOSITORY,
} from '@app/event/domain/reward/ports/reward.repository';
import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';
import { TestingModule, Test } from '@nestjs/testing';
import {
  itemRewardInputFixture,
  nexonCashRewardInputFixture,
  invalidDetailsItemRewardInputFixture,
  invalidQuantityRewardInputFixture,
} from '../../../../test/fixture/rewards.fixture';
import { Types } from 'mongoose';
import { RewardMongoFactory } from '@app/event/infrastructure/factories/reward-mongo.factory';

const mockRewardRepository: jest.Mocked<RewardRepository> = {
  findById: jest.fn(),
  findByEventIdAndName: jest.fn(),
  save: jest.fn(),
};

const mockEventRepository: jest.Mocked<EventRepository> = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
};

describe('CreateRewardUseCase', () => {
  let useCase: CreateRewardUseCase;

  const existingEventId = new Types.ObjectId();
  const mockExistingEvent = new Event();
  mockExistingEvent._id = existingEventId;
  mockExistingEvent.name = '테스트 이벤트';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRewardUseCase,
        RewardDetailsValidatorService,
        { provide: REWARD_REPOSITORY, useValue: mockRewardRepository },
        { provide: EVENT_REPOSITORY, useValue: mockEventRepository },
        { provide: REWARD_FACTORY, useClass: RewardMongoFactory },
      ],
    }).compile();

    useCase = module.get<CreateRewardUseCase>(CreateRewardUseCase);
  });

  const getBaseRewardInput = (
    overrides: Partial<CreateRewardInput> = {},
  ): CreateRewardInput => {
    const baseDetails: MileageRewardDetails = { amount: 100 }; // 기본은 마일리지
    return {
      eventId: existingEventId.toHexString(),
      name: '기본 마일리지 보상',
      type: RewardType.MILEAGE,
      details: baseDetails,
      quantity: null, // 무제한
      createdBy: new Types.ObjectId().toHexString(),
      ...overrides,
    };
  };

  describe('성공적인 보상 등록', () => {
    it('모든 유효성 검사를 통과하고 새 MILEAGE 보상을 성공적으로 등록해야 한다', async () => {
      const validInput = getBaseRewardInput();
      const mockSavedReward = new Reward();
      Object.assign(mockSavedReward, {
        ...validInput,
        _id: new Types.ObjectId(),
        eventId: existingEventId,
        createdBy: new Types.ObjectId(validInput.createdBy),
        remainingQuantity: validInput.quantity,
      });

      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(null);
      mockRewardRepository.save.mockResolvedValue(
        mockSavedReward as RewardDocument,
      );

      const result = await useCase.execute(validInput);

      expect(mockEventRepository.findById).toHaveBeenCalledWith(
        validInput.eventId,
      );

      expect(mockRewardRepository.findByEventIdAndName).toHaveBeenCalledWith(
        validInput.eventId,
        validInput.name,
      );
      expect(mockRewardRepository.save).toHaveBeenCalledWith(
        expect.any(Reward),
      );
      expect(result).toEqual(mockSavedReward);
    });

    it('모든 유효성 검사를 통과하고 새 ITEM 보상을 성공적으로 등록해야 한다', async () => {
      const itemInput = getBaseRewardInput({
        ...itemRewardInputFixture,
        eventId: existingEventId.toHexString(),
      });
      const mockSavedItemReward = new Reward();
      Object.assign(mockSavedItemReward, {
        ...itemInput,
        _id: new Types.ObjectId(),
        eventId: new Types.ObjectId(itemInput.eventId.toString()),
        createdBy: new Types.ObjectId(itemInput.createdBy.toString()),
        details: itemInput.details,
        quantity: itemInput.quantity,
        remainingQuantity: itemInput.quantity,
        createdAt: new Date(),
      });
      mockSavedItemReward._id = new Types.ObjectId();

      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(null);
      mockRewardRepository.save.mockResolvedValue(
        mockSavedItemReward as RewardDocument,
      );

      const result = await useCase.execute(itemInput);

      expect(result.type).toBe(itemInput.type);
      expect(result.details).toEqual(itemInput.details);
    });

    it('모든 유효성 검사를 통과하고 새 NEXON_CASH 타입 보상을 성공적으로 등록해야 한다', async () => {
      const nexonCashInput = getBaseRewardInput({
        ...nexonCashRewardInputFixture,
        eventId: existingEventId.toHexString(),
      });
      const mockSavedNexonCashReward = new Reward();
      Object.assign(mockSavedNexonCashReward, {
        ...nexonCashInput,
        _id: new Types.ObjectId(),
        eventId: new Types.ObjectId(nexonCashInput.eventId.toString()),
        createdBy: new Types.ObjectId(nexonCashInput.createdBy.toString()),
        details: nexonCashInput.details,
        quantity: nexonCashInput.quantity,
        remainingQuantity: nexonCashInput.quantity,
        createdAt: new Date(),
      });

      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(null);
      mockRewardRepository.save.mockResolvedValue(
        mockSavedNexonCashReward as RewardDocument,
      );

      const result = await useCase.execute(nexonCashInput);

      expect(result.type).toBe(nexonCashInput.type);
      expect(result.details).toEqual(nexonCashInput.details);
    });
  });

  describe('유효성 검증 실패 케이스', () => {
    it('존재하지 않는 eventId로 보상 등록 시 EventNotFoundForRewardException을 던져야 한다', async () => {
      const input = getBaseRewardInput({
        eventId: new Types.ObjectId().toHexString(),
      });
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(
        EventNotFoundForRewardException,
      );

      expect(mockRewardRepository.save).not.toHaveBeenCalled();
    });

    it('RewardDetailsValidatorService가 예외를 던지면 해당 예외가 전파되어야 한다 (InvalidRewardDetailsException)', async () => {
      const input = getBaseRewardInput({
        ...invalidDetailsItemRewardInputFixture,
        eventId: existingEventId.toHexString(),
      });
      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );

      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidRewardDetailsException,
      );
      expect(mockRewardRepository.save).not.toHaveBeenCalled();
    });

    it('동일 이벤트 내에 이미 같은 이름의 보상이 존재하면 RewardAlreadyExistsInEventException을 던져야 한다', async () => {
      const input = getBaseRewardInput();
      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(
        new Reward() as RewardDocument,
      );

      await expect(useCase.execute(input)).rejects.toThrow(
        RewardAlreadyExistsInEventException,
      );
      expect(mockRewardRepository.save).not.toHaveBeenCalled();
    });

    it('quantity가 음수일 경우 InvalidRewardQuantityException을 던져야 한다', async () => {
      const input = getBaseRewardInput({
        ...invalidQuantityRewardInputFixture,
        eventId: existingEventId.toHexString(),
      });
      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidRewardQuantityException,
      );
      expect(mockRewardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('데이터베이스 저장 실패', () => {
    it('보상 저장 중 Repository 에러 발생 시 DatabaseOperationException을 던져야 한다', async () => {
      const input = getBaseRewardInput();
      mockEventRepository.findById.mockResolvedValue(
        mockExistingEvent as EventDocument,
      );
      mockRewardRepository.findByEventIdAndName.mockResolvedValue(null);
      mockRewardRepository.save.mockRejectedValue(
        new Error('DB 저장 실패 시뮬레이션'),
      );

      await expect(useCase.execute(input)).rejects.toThrow(
        DatabaseOperationException,
      );
    });
  });
});
