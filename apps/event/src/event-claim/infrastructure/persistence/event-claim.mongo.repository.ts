import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession, FilterQuery } from 'mongoose';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import {
  EventClaim,
  EventClaimDocument,
  ClaimStatus,
} from '@app/event/event-claim/domain/entities/event-claim.entity';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import {
  EventClaimRepository,
  ListEventClaimsCriteria,
} from '@app/event/event-claim/domain/ports/event-claim.repository';
import {
  EventClaimData,
  GrantedRewardData,
} from '@app/event/event-claim/domain/interfaces/event-claim-data.interface';
import {
  BasePaginationOptions,
  getMongooseQueryOptions,
} from '@app/common/database/moongoose/utils/pagination.utils';

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
        status: ClaimStatus.SUCCESS,
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

  async findAllWithPagination(
    criteria: ListEventClaimsCriteria,
    pagination: BasePaginationOptions,
  ): Promise<[EventClaimData[], number]> {
    const query: FilterQuery<EventClaimDocument> = {};

    if (criteria.userId) {
      query.userId = new Types.ObjectId(criteria.userId.toString());
    }
    if (criteria.eventId) {
      query.eventId = new Types.ObjectId(criteria.eventId.toString());
    }
    if (criteria.status) {
      query.status = criteria.status;
    }
    if (criteria.requestedAtFrom || criteria.requestedAtTo) {
      query.requestedAt = {};
      if (criteria.requestedAtFrom) {
        (query.requestedAt as any).$gte = criteria.requestedAtFrom;
      }
      if (criteria.requestedAtTo) {
        (query.requestedAt as any).$lte = criteria.requestedAtTo;
      }
    }

    const { skip, limit, sort } = getMongooseQueryOptions(
      pagination,
      'requestedAt',
      'desc',
    );

    try {
      const claimDocs = await this.eventClaimModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean<EventClaimDocument[]>()
        .exec();

      const totalCount = await this.eventClaimModel
        .countDocuments(query)
        .exec();

      const claimsData = claimDocs
        .map((doc) => this.mapToEventClaimData(doc)!)
        .filter(Boolean) as EventClaimData[];
      return [claimsData, totalCount];
    } catch (error: any) {
      this.logger.error(
        `Error finding all event claims: ${error.message}`,
        error.stack,
      );
      throw new DatabaseOperationException(
        '이벤트 클레임 목록 조회 중 오류 발생',
        error,
      );
    }
  }

  private mapToEventClaimData(
    doc: EventClaimDocument | null,
  ): EventClaimData | null {
    if (!doc) return null;
    const leanDoc = doc.toObject
      ? doc.toObject({ virtuals: true })
      : { ...doc };

    const grantedRewards = (leanDoc.grantedRewards || []).map(
      (gr: GrantedRewardData) => ({
        rewardId: gr.rewardId,
        name: gr.name,
        type: gr.type,
        details: gr.details,
      }),
    ) as GrantedRewardData[];

    const conditionCheckDetail = leanDoc.conditionCheckDetail;

    return {
      _id: leanDoc._id,
      userId: leanDoc.userId,
      eventId: leanDoc.eventId,
      status: leanDoc.status,
      grantedRewards,
      conditionCheckDetail,
      failureReason: leanDoc.failureReason,
      requestedAt: leanDoc.requestedAt,
      processedAt: leanDoc.processedAt,
      createdAt: leanDoc.createdAt,
      updatedAt: leanDoc.updatedAt,
      id: leanDoc._id.toHexString(),
    };
  }
}
