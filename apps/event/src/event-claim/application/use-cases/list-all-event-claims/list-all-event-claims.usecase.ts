import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EVENT_CLAIM_REPOSITORY,
  EventClaimRepository, // IEventClaimRepository 대신 실제 클래스 사용 (네 컨벤션)
  ListEventClaimsCriteria,
} from '@app/event/event-claim/domain/ports/event-claim.repository';
import { ListAllEventClaimsUseCaseInput } from './list-all-event-claims.input';
import { ListAllEventClaimsUseCaseOutput } from './list-all-event-claims.output';
import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';

@Injectable()
export class ListAllEventClaimsUseCase {
  private readonly logger = new Logger(ListAllEventClaimsUseCase.name);

  constructor(
    @Inject(EVENT_CLAIM_REPOSITORY)
    private readonly eventClaimRepository: EventClaimRepository,
  ) {}

  async execute(
    input: ListAllEventClaimsUseCaseInput,
  ): Promise<ListAllEventClaimsUseCaseOutput> {
    this.logger.log(
      `[ListAllEventClaimsUseCase] 전체/필터링 보상 요청 이력 조회: filters=${JSON.stringify({ userId: input.userId, eventId: input.eventId, status: input.status })}`,
    );

    const criteria: ListEventClaimsCriteria = {
      userId: input.userId, // <--- 관리자는 특정 userId로 필터링 가능 (없으면 전체)
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

    const [claimsData, totalCount] =
      await this.eventClaimRepository.findAllWithPagination(
        criteria,
        pagination,
      );

    const currentPage = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    this.logger.log(
      `${claimsData.length}개의 클레임 조회 완료 (총 ${totalCount}개)`,
    );

    return {
      claims: claimsData, // EventClaimData[] 그대로 반환
      totalCount,
      currentPage,
      itemsPerPage: limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
