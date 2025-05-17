import { Test, TestingModule } from '@nestjs/testing';
import { CreateEventUseCase } from './create-event.usecase';
import { Event } from '../../../domain/event/entities/event.entity';
import { EventStatus } from '../../../domain/event/value-objects/event-status.vo';
import {
  EventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/ports/event.repository';
import {
  EventAlreadyExistsException,
  InvalidEventPeriodException,
} from '../../../domain/event/errors/event.exception';
import {
  EventMustHaveConditionsException,
  InvalidEventConditionValueException,
  UnsupportedEventConditionTypeException,
} from '../../../domain/event/errors/event-condition.exception';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { Types } from 'mongoose';
import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import {
  loginCountConditionFixture,
  combinedConditionsFixture,
  newUserJoinDateConditionFixture,
  returningUserLastLoginConditionFixture,
  invalidCategoryConditionFixture,
  invalidTypeConditionFixture,
} from '../../../../test/fixture/event-conditions.fixture';
import { EVENT_FACTORY } from '@app/event/domain/event/factories/event.factory';
import { EventMongoFactory } from '@app/event/infrastructure/factories/event-mongo.factory';
import { EventConditionsValidatorService } from '@app/event/application/services/event-conditions-validator.service';

const mockEventRepository: jest.Mocked<EventRepository> = {
  findByName: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
};

describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEventUseCase,
        EventConditionsValidatorService,
        { provide: EVENT_REPOSITORY, useValue: mockEventRepository },
        { provide: EVENT_FACTORY, useClass: EventMongoFactory },
      ],
    }).compile();

    useCase = module.get<CreateEventUseCase>(CreateEventUseCase);
  });

  const defaultCreatedById = new Types.ObjectId().toHexString();
  const getBaseEventInput = (
    overrides: Partial<CreateEventInput> = {},
  ): CreateEventInput => ({
    name: '기본 이벤트 이름',
    description: '기본 이벤트 설명입니다.',
    startDate: new Date('2025-07-01T00:00:00Z'),
    endDate: new Date('2025-07-31T23:59:59Z'),
    conditions: [loginCountConditionFixture],
    requiresManualApproval: false,
    createdBy: defaultCreatedById,
    status: EventStatus.SCHEDULED,
    ...overrides,
  });

  describe('성공적인 이벤트 등록', () => {
    it('모든 유효성 검사를 통과하고 새 이벤트를 성공적으로 등록해야 한다', async () => {
      const validInput = getBaseEventInput({
        conditions: combinedConditionsFixture,
      });
      const mockSavedEvent = new Event();
      Object.assign(mockSavedEvent, {
        ...validInput,
        _id: new Types.ObjectId(),
        createdBy: new Types.ObjectId(validInput.createdBy),
        conditions: validInput.conditions.map((c) => ({ ...c })),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.save.mockResolvedValue(mockSavedEvent);

      const result = await useCase.execute(validInput);

      expect(mockEventRepository.findByName).toHaveBeenCalledWith(
        validInput.name,
      );
      expect(mockEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validInput.name,
          startDate: new Date(validInput.startDate),
          endDate: new Date(validInput.endDate),
          status: validInput.status || EventStatus.SCHEDULED,
          createdBy: new Types.ObjectId(validInput.createdBy),
        }),
      );
      const savedCallArg = mockEventRepository.save.mock.calls[0][0] as Event;
      expect(savedCallArg.conditions.length).toBe(
        combinedConditionsFixture.length,
      );
      expect(result).toEqual(mockSavedEvent);
    });

    it('신규 유저 조건을 포함한 이벤트도 성공적으로 등록되어야 한다', async () => {
      const input = getBaseEventInput({
        conditions: [newUserJoinDateConditionFixture],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.save.mockImplementation((event) =>
        Promise.resolve(event as Event),
      );

      const result = await useCase.execute(input);
      expect(result.conditions).toEqual(
        expect.arrayContaining([
          expect.objectContaining(newUserJoinDateConditionFixture),
        ]),
      );
    });

    it('복귀 유저 조건을 포함한 이벤트도 성공적으로 등록되어야 한다 (SUPPORTED_EVENT_TYPES에 LAST_LOGIN_AT 추가 가정)', async () => {
      const input = getBaseEventInput({
        conditions: [returningUserLastLoginConditionFixture],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.save.mockImplementation((event) =>
        Promise.resolve(event as Event),
      );
      const result = await useCase.execute(input);
      expect(result.conditions).toEqual(
        expect.arrayContaining([
          expect.objectContaining(returningUserLastLoginConditionFixture),
        ]),
      );
    });
  });

  describe('이벤트 이름 중복 검증', () => {
    it('이미 존재하는 이벤트 이름으로 등록 시 EventAlreadyExistsException을 던져야 한다', async () => {
      const input = getBaseEventInput();
      mockEventRepository.findByName.mockResolvedValue(new Event());
      await expect(useCase.execute(input)).rejects.toThrow(
        EventAlreadyExistsException,
      );
      expect(mockEventRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('이벤트 기간 유효성 검증', () => {
    it('시작일이 종료일과 같을 경우 InvalidEventPeriodException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        endDate: getBaseEventInput().startDate,
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidEventPeriodException,
      );
    });

    it('시작일이 종료일보다 늦을 경우 InvalidEventPeriodException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        startDate: getBaseEventInput().endDate,
        endDate: getBaseEventInput().startDate,
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidEventPeriodException,
      );
    });
  });

  describe('이벤트 조건 유효성 검증 (validateEventConditions 메소드 타겟)', () => {
    it('조건이 하나도 없을 경우 EventMustHaveConditionsException을 던져야 한다', async () => {
      const input = getBaseEventInput({ conditions: [] });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        EventMustHaveConditionsException,
      );
    });

    it('지원하지 않는 조건 카테고리일 경우 UnsupportedEventConditionTypeException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        conditions: [invalidCategoryConditionFixture],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        UnsupportedEventConditionTypeException,
      );
    });

    it('지원하지 않는 조건 타입일 경우 UnsupportedEventConditionTypeException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        conditions: [invalidTypeConditionFixture],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        UnsupportedEventConditionTypeException,
      );
    });

    it('조건의 value가 숫자가 아닐 경우 InvalidEventConditionValueException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        conditions: [{ ...loginCountConditionFixture, value: 'not-a-number' }],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidEventConditionValueException,
      );
    });

    it('조건의 value가 음수일 경우 InvalidEventConditionValueException을 던져야 한다', async () => {
      const input = getBaseEventInput({
        conditions: [{ ...loginCountConditionFixture, value: -5 }],
      });
      mockEventRepository.findByName.mockResolvedValue(null);
      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidEventConditionValueException,
      );
    });
  });

  describe('데이터베이스 저장 실패', () => {
    it('이벤트 저장 중 Repository 에러 발생 시 DatabaseOperationException을 던져야 한다', async () => {
      const input = getBaseEventInput();
      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.save.mockRejectedValue(
        new Error('DB 저장 실패 시뮬레이션'),
      );
      await expect(useCase.execute(input)).rejects.toThrow(
        DatabaseOperationException,
      );
    });
  });
});
