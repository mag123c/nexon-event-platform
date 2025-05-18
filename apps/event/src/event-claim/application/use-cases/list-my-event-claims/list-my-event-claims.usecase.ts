import { Inject, Injectable, Logger } from '@nestjs/common';

import { ListMyEventClaimsUseCaseInput } from './list-my-event-claims.input';
import { ListMyEventClaimsUseCaseOutput } from './list-my-event-claims.output';
import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import {
  EVENT_CLAIM_REPOSITORY,
  EventClaimRepository,
  ListEventClaimsCriteria,
} from '@app/event/event-claim/domain/ports/event-claim.repository';

@Injectable()
export class ListMyEventClaimsUseCase {
  private readonly logger = new Logger(ListMyEventClaimsUseCase.name);

  constructor(
    @Inject(EVENT_CLAIM_REPOSITORY)
    private readonly eventClaimRepository: EventClaimRepository,
  ) {}

  async execute(
    input: ListMyEventClaimsUseCaseInput,
  ): Promise<ListMyEventClaimsUseCaseOutput> {
    this.logger.log(
      `내 보상 요청 이력 조회: userId=${input.requestingUserId}, filters=${JSON.stringify({ eventId: input.eventId, status: input.status })}`,
    );

    const criteria: ListEventClaimsCriteria = {
      userId: input.requestingUserId,
      eventId: input.eventId,
      status: input.status,
      requestedAtFrom: input.requestedAtFrom,
      requestedAtTo: input.requestedAtTo,
    };

    const pagination: BasePaginationOptions = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    };

    const [claims, totalCount] =
      await this.eventClaimRepository.findAllWithPagination(
        criteria,
        pagination,
      );

    const currentPage = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    this.logger.log(
      `userId=${input.requestingUserId}에 대해 ${claims.length}개의 클레임 조회 완료 (총 ${totalCount}개)`,
    );

    return {
      claims,
      totalCount,
      currentPage,
      itemsPerPage: limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
