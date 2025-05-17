import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { RewardDetailsValidatorService } from '@app/event/application/services/reward-details-validator.service';
import { CreateRewardInput } from '@app/event/application/use-cases/create-reward/create-reward.input';
import {
  EVENT_REPOSITORY,
  EventRepository,
} from '@app/event/domain/event/ports/event.repository';
import { Reward } from '@app/event/domain/reward/entities/reward.entity';
import {
  EventNotFoundForRewardException,
  InvalidRewardQuantityException,
  RewardAlreadyExistsInEventException,
} from '@app/event/domain/reward/errors/reward.exception';
import {
  REWARD_FACTORY,
  RewardFactory,
} from '@app/event/domain/reward/factories/reward.factory';
import {
  REWARD_REPOSITORY,
  RewardRepository,
} from '@app/event/domain/reward/ports/reward.repository';
import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class CreateRewardUseCase {
  private readonly logger = new Logger(CreateRewardUseCase.name);

  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: RewardRepository,
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(REWARD_FACTORY) private readonly rewardFactory: RewardFactory,
    private readonly detailsValidator: RewardDetailsValidatorService,
  ) {}

  /**
   * @description 새로운 보상을 생성하고 특정 이벤트에 연결합니다.
   * @param input - 보상 생성을 위한 입력 데이터
   * @returns 생성된 보상 객체
   * @throws EventNotFoundForRewardException - 보상을 연결할 eventId의 이벤트가 존재하지 않을 경우
   * @throws InvalidRewardQuantityException - 보상 수량(quantity)이 유효하지 않을 경우
   * @throws InvalidRewardDetailsException - 보상 타입에 따른 상세 정보(details)가 유효하지 않을 경우
   * @throws DatabaseOperationException - 데이터베이스 저장 중 오류 발생 시
   */
  async execute(input: CreateRewardInput): Promise<Reward> {
    this.logger.log(`보상 생성 요청: ${JSON.stringify(input)}`);

    // eventId 유효성 검사 (해당 이벤트가 존재하는지)
    const eventExists = await this.eventRepository.findById(input.eventId);
    if (!eventExists) {
      this.logger.warn(
        `Event not found for reward creation: eventId=${input.eventId}`,
      );
      throw new EventNotFoundForRewardException(
        `이벤트 ID "${input.eventId}"에 해당하는 이벤트를 찾을 수 없습니다.`,
      );
    }

    // 보상 이름 중복 검사
    const existingRewardWithName =
      await this.rewardRepository.findByEventIdAndName(
        input.eventId,
        input.name,
      );
    if (existingRewardWithName) {
      this.logger.warn(
        `이미 존재하는 보상 이름: "${input.name}" (이벤트 ID: ${input.eventId})`,
      );
      throw new RewardAlreadyExistsInEventException(input.eventId, input.name);
    }

    // 보상 타입 및 상세 정보(details) 유효성 검사
    this.detailsValidator.validate(input.type, input.details);

    // 보상 수량(quantity) 유효성 검사
    if (input.quantity !== undefined && input.quantity !== null) {
      if (
        typeof input.quantity !== 'number' ||
        isNaN(input.quantity) ||
        input.quantity < 0
      ) {
        this.logger.warn(`Invalid reward quantity: ${input.quantity}`);
        throw new InvalidRewardQuantityException(
          '보상 수량은 0 또는 양의 숫자여야 합니다.',
        );
      }
      if (!Number.isInteger(input.quantity) && input.quantity !== 0) {
        this.logger.warn(`보상 수량은 정수여야 합니다: ${input.quantity}`);
        throw new InvalidRewardQuantityException(
          '보상 수량은 정수여야 합니다 (0 제외).',
        );
      }
    }

    const newReward = this.rewardFactory.create(input, eventExists._id);

    try {
      const savedReward = await this.rewardRepository.save(newReward);
      this.logger.log(`보상 생성 완료: ${JSON.stringify(savedReward)}`);
      return savedReward;
    } catch (error: any) {
      this.logger.error(
        `보상 생성 중 오류 발생: ${error.message}`,
        error.stack,
      );
      throw new DatabaseOperationException(
        `보상 "${newReward.name}" 생성 중 데이터베이스 오류가 발생했습니다.`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
