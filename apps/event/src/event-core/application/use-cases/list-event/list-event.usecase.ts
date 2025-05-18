import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { ListEventsUseCaseInput } from '@app/event/event-core/application/use-cases/list-event/list-event.input';
import { ListEventsUseCaseOutput } from '@app/event/event-core/application/use-cases/list-event/list-event.output';
import {
  EVENT_REPOSITORY,
  EventRepository,
  ListEventsCriteria,
} from '@app/event/event-core/domain/ports/event.repository';
import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class ListEventsUseCase {
  private readonly logger = new Logger(ListEventsUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async execute(
    input: ListEventsUseCaseInput,
  ): Promise<ListEventsUseCaseOutput> {
    this.logger.log(
      `[ListEventsUseCase] 이벤트 목록 조회 요청: ${JSON.stringify(input)}`,
    );

    const criteria: ListEventsCriteria = {
      name: input.name,
      status: input.status,
    };

    const pagination: BasePaginationOptions = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    };

    const [events, totalCount] =
      await this.eventRepository.findAllWithPagination(criteria, pagination);

    const currentPage = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    this.logger.log(
      `[ListEventsUseCase] ${events.length}개의 이벤트 조회 완료 (총 ${totalCount}개)`,
    );

    return {
      events,
      totalCount,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
