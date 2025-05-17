import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  EventClaim,
  EventClaimDocument,
  ClaimStatus,
  EventClaimData,
} from '@app/event/domain/event-claim/entities/event-claim.entity';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { EventClaimRepository } from '@app/event/domain/event-claim/ports/event-claim.repository';

@Injectable()
export class EventClaimMongoRepository implements EventClaimRepository {
  private readonly logger = new Logger(EventClaimMongoRepository.name);

  constructor(
    @InjectModel(EventClaim.name, MONGO_CONNECTIONS.EVENT)
    private readonly eventClaimModel: Model<EventClaimDocument>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<EventClaim | null> {
    return this.eventClaimModel.findById(id).exec();
  }

  async findSuccessfulClaim(
    userId: string | Types.ObjectId,
    eventId: string | Types.ObjectId,
  ): Promise<EventClaim | null> {
    return this.eventClaimModel
      .findOne({
        userId,
        eventId,
        status: ClaimStatus.SUCCESS, // 성공한 요청 조회
      })
      .exec();
  }

  async save(eventClaim: EventClaimData): Promise<EventClaim> {
    try {
      const modelInstance =
        eventClaim instanceof this.eventClaimModel
          ? eventClaim
          : new this.eventClaimModel(eventClaim);
      return await modelInstance.save();
    } catch (error: any) {
      this.logger.error(
        `Error saving event claim: ${error.message}`,
        error.stack,
      );
      throw new DatabaseOperationException(
        '이벤트 보상 신청 저장 중 오류 발생',
        error,
      );
    }
  }

  async saveInSession(
    eventClaim: EventClaimData,
    session: ClientSession,
  ): Promise<EventClaim> {
    try {
      const modelInstance =
        eventClaim instanceof this.eventClaimModel
          ? eventClaim
          : new this.eventClaimModel(eventClaim);
      return await modelInstance.save({ session });
    } catch (error: any) {
      this.logger.error(
        `Error saving event claim in session: ${error.message}`,
        error.stack,
      );
      throw new DatabaseOperationException(
        '이벤트 보상 신청 저장(세션) 중 오류 발생',
        error,
      );
    }
  }
}
