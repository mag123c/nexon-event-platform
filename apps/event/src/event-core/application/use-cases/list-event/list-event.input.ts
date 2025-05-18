import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo'; // 경로 확인

export interface ListEventsUseCaseInput extends BasePaginationOptions {
  // 필터 조건
  name?: string;
  status?: EventStatus;
}
