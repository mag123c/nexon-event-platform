import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { EventConditionsValidatorService } from '@app/event/application/services/event-conditions-validator.service';
import { CreateEventInput } from '@app/event/application/use-cases/craete-event/craete-event.input';
import { Event } from '@app/event/domain/event/entities/event.entity';
import {
  EventAlreadyExistsException,
  InvalidEventPeriodException,
} from '@app/event/domain/event/errors/event.exception';
import {
  EVENT_FACTORY,
  EventFactory,
} from '@app/event/domain/event/factories/event.factory';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/domain/event/ports/event.repository';
import { Injectable, Logger, Inject } from '@nestjs/common';
@Injectable()
export class CreateEventUseCase {
  private readonly logger = new Logger(CreateEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(EVENT_FACTORY) private readonly eventFactory: EventFactory,
    private readonly conditionsValidator: EventConditionsValidatorService,
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
    this.logger.log(`이벤트 생성 요청: ${JSON.stringify(input)}`);

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
    this.conditionsValidator.validate(input.conditions);

    const newEvent = this.eventFactory.create(input, startDate, endDate);

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
}
