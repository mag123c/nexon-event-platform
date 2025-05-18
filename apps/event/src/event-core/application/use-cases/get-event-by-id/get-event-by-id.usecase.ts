import { GetEventByIdUseCaseInput } from '@app/event/event-core/application/use-cases/get-event-by-id/get-event-by-id.input';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventNotFoundException } from '@app/event/event-core/domain/errors/event.exception';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/event-core/domain/ports/event.repository';
import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class GetEventByIdUseCase {
  private readonly logger = new Logger(GetEventByIdUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async execute(input: GetEventByIdUseCaseInput): Promise<Event> {
    this.logger.log(
      `[GetEventByIdUseCase] 이벤트 상세 조회 요청: eventId=${input.eventId}`,
    );
    const event = await this.eventRepository.findById(input.eventId);
    if (!event) {
      this.logger.warn(
        `[GetEventByIdUseCase] 이벤트를 찾을 수 없음: eventId=${input.eventId}`,
      );
      throw new EventNotFoundException(input.eventId); // 적절한 예외 사용
    }
    return event;
  }
}
