import { EventNotFoundException } from '@app/event/event-core/domain/errors/event.exception';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/event-core/domain/ports/event.repository';
import { ListRewardsByEventIdUseCaseInput } from '@app/event/reward/application/use-cases/list-rewards-by-event-id/list-rewards-by-event-id.input';
import { ListRewardsByEventIdUseCaseOutput } from '@app/event/reward/application/use-cases/list-rewards-by-event-id/list-rewards-by-event-id.output';
import {
  REWARD_REPOSITORY,
  RewardRepository,
} from '@app/event/reward/domain/ports/reward.repository';
import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class ListRewardsByEventIdUseCase {
  private readonly logger = new Logger(ListRewardsByEventIdUseCase.name);

  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: RewardRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async execute(
    input: ListRewardsByEventIdUseCaseInput,
  ): Promise<ListRewardsByEventIdUseCaseOutput> {
    this.logger.log(`이벤트 ID [${input.eventId}]의 보상 목록 조회 요청`);

    // 해당 이벤트가 존재하는지 확인
    const eventExists = await this.eventRepository.findById(input.eventId);
    if (!eventExists) {
      this.logger.warn(`이벤트를 찾을 수 없음: eventId=${input.eventId}`);
      throw new EventNotFoundException(input.eventId);
    }

    // 이벤트 ID로 보상 목록 조회
    const rewards = await this.rewardRepository.findByEventId(input.eventId);

    this.logger.log(
      `이벤트 ID [${input.eventId}]에 대해 ${rewards.length}개의 보상 조회 완료.`,
    );

    return { rewards };
  }
}
