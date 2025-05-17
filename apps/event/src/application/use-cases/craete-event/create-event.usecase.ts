import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { SUPPORTED_EVENT_TYPES } from '@app/event/application/config/event-condition.config';
import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import { EventConditionInput } from '@app/event/application/use-cases/craete-event/event-condition.input';
import { EventCondition } from '@app/event/domain/event/embedded/event-condition.schema';
import { Event } from '@app/event/domain/event/entities/event.entity';
import {
  EventMustHaveConditionsException,
  InvalidEventConditionValueException,
  UnsupportedEventConditionTypeException,
} from '@app/event/domain/event/errors/event-condition.exception';
import {
  EventAlreadyExistsException,
  InvalidEventPeriodException,
} from '@app/event/domain/event/errors/event.exception';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/domain/event/ports/event.repository';
import { EventStatus } from '@app/event/domain/event/value-objects/event-status.vo';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
@Injectable()
export class CreateEventUseCase {
  private readonly logger = new Logger(CreateEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
  ) {}

  /**
   * @description 새로운 이벤트를 생성합니다.
   * @param input - 이벤트 생성을 위한 입력 데이터
   * @returns 생성된 이벤트 객체
   * @throws EventAlreadyExistsException - 동일한 이름의 이벤트가 이미 존재할 경우
   * @throws InvalidEventPeriodException - 이벤트 시작일이 종료일보다 늦거나 같을 경우
   * @throws InvalidEventNameException - 이벤트 이름이 유효하지 않을 경우 (예: 길이 제한)
   * @throws EventMustHaveConditionsException - 이벤트 조건이 하나도 없는 경우 (정책에 따라)
   * @throws UnsupportedEventConditionTypeException - 지원하지 않는 이벤트 조건 카테고리 또는 타입일 경우
   * @throws InvalidEventConditionValueException - 이벤트 조건의 값이 유효하지 않을 경우
   * @throws DatabaseOperationException - 데이터베이스 저장 중 오류 발생 시
   */
  async execute(input: CreateEventInput): Promise<Event> {
    this.logger.log(`Attempting to create event with name: "${input.name}"`);

    // 이벤트 이름 중복 검사
    if (await this.eventRepository.findByName(input.name)) {
      this.logger.warn(`Event name already exists: "${input.name}"`);
      throw new EventAlreadyExistsException(input.name);
    }

    // 이벤트 기간 유효성 검사 (시작일 < 종료일)
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (startDate >= endDate) {
      this.logger.warn(
        `Invalid event period: startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`,
      );
      throw new InvalidEventPeriodException(
        '이벤트 시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    // 이벤트 조건 유효성 검사 (카테고리, 타입, 값 형식 등)
    this.validateEventConditions(input.conditions);

    const newEvent = new Event();
    newEvent.name = input.name;
    newEvent.description = input.description;
    newEvent.startDate = startDate;
    newEvent.endDate = endDate;
    newEvent.status = input.status || EventStatus.SCHEDULED;

    newEvent.conditions = input.conditions.map((cInput) => ({
      category: cInput.category,
      type: cInput.type,
      operator: cInput.operator,
      value: cInput.value,
      unit: cInput.unit,
      description: cInput.description,
    })) as Types.DocumentArray<EventCondition>;

    newEvent.requiresManualApproval = input.requiresManualApproval || false;
    newEvent.createdBy = new Types.ObjectId(input.createdBy);

    try {
      const savedEvent = await this.eventRepository.save(newEvent);
      this.logger.log(
        `이벤트 "${savedEvent.name}(${savedEvent._id}"이(가) 성공적으로 생성되었습니다.`,
      );
      return savedEvent;
    } catch (error: any) {
      this.logger.error(
        `이벤트 "${newEvent.name}" 생성 중 오류 발생: ${error.message}`,
        error.stack,
      );
      throw new DatabaseOperationException(
        `이벤트 "${newEvent.name}" 생성 중 데이터베이스 오류가 발생했습니다.`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * @description
   * 이벤트 조건 배열을 순회하며 각 조건의 유효성을 검사합니다.
   * 1. 이벤트 조건이 최소 1개 이상 존재하는지 확인합니다.
   * 2. 지원하는 카테고리 및 타입 조합인지 확인합니다.
   * 3. 각 조건 타입에 따라 값(value)이 유효한 숫자인지, 그리고 음수가 아닌지 확인합니다.
   * @param conditions - 검증할 이벤트 조건 객체 배열 (EventConditionInput[])
   * @throws EventMustHaveConditionsException - 이벤트 조건이 하나도 없는 경우
   * @throws UnsupportedEventConditionTypeException - 지원하지 않는 조건 카테고리 또는 타입일 경우
   * @throws InvalidEventConditionValueException - value가 유효한 숫자가 아닐 경우
   */
  private validateEventConditions(conditions: EventConditionInput[]): void {
    if (!conditions || conditions.length === 0) {
      this.logger.warn('Attempted to create event with no conditions.');
      throw new EventMustHaveConditionsException();
    }

    for (const condition of conditions) {
      // 지원하는 카테고리 및 타입 조합인지 확인
      const supportedTypesForCategory =
        SUPPORTED_EVENT_TYPES[condition.category];
      if (
        !supportedTypesForCategory ||
        !supportedTypesForCategory.includes(condition.type)
      ) {
        this.logger.warn(
          `Unsupported event condition: Category='${condition.category}', Type='${condition.type}'`,
        );
        throw new UnsupportedEventConditionTypeException(
          condition.category,
          condition.type,
        );
      }

      // 모든 조건의 value는 숫자여야 하고, 음수가 아니어야함.
      if (
        typeof condition.value !== 'number' ||
        isNaN(condition.value) ||
        condition.value < 0
      ) {
        this.logger.warn(
          `조건 value 검증 실패: 카테고리='${condition.category}', 타입='${condition.type}', 값='${condition.value}'`,
        );
        throw new InvalidEventConditionValueException(
          condition.category,
          condition.type,
          condition.value,
          '값은 0 또는 양의 숫자여야 합니다. (날짜 관련 값은 유효한 타임스탬프여야 합니다)',
        );
      }
    }
    this.logger.log('All event conditions validated successfully.');
  }
}
