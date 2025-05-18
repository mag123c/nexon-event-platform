import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { EventDocument } from '@app/event/event-core/domain/entities/event.entity';
import {
  EventRepository,
  ListEventsCriteria,
} from '@app/event/event-core/domain/ports/event.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import {
  BasePaginationOptions,
  getMongooseQueryOptions,
} from '@app/common/database/moongoose/utils/pagination.utils';

@Injectable()
export class EventMongoRepository implements EventRepository {
  constructor(
    @InjectModel(Event.name, MONGO_CONNECTIONS.EVENT)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async findById(id: string): Promise<Event | null> {
    const eventDoc = await this.eventModel.findById(id).lean().exec();
    if (!eventDoc) {
      return null;
    }

    const condition = eventDoc?.condition;
    eventDoc.condition =
      typeof condition === 'string' ? JSON.parse(condition) : condition;
    return eventDoc;
  }

  async findByName(name: string): Promise<Event | null> {
    return this.eventModel.findOne({ name }).lean();
  }

  async findAllWithPagination(
    criteria: ListEventsCriteria,
    pagination: BasePaginationOptions,
  ): Promise<[Event[], number]> {
    const query: FilterQuery<EventDocument> = {};
    const { skip, limit, sort } = getMongooseQueryOptions(
      pagination,
      'createdAt',
      'desc',
    );

    // 필터링 조건 설정
    // 제목
    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' };
    }
    // 상태
    if (criteria.status) {
      query.status = criteria.status;
    }

    try {
      const eventDocs = await this.eventModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean<EventDocument[]>()
        .exec();

      const totalCount = await this.eventModel.countDocuments(query).exec();

      const eventsData = eventDocs.map((doc) => this.mapToEventData(doc)!);
      return [eventsData, totalCount];
    } catch (error: any) {
      throw new DatabaseOperationException(
        '이벤트 목록 조회 중 오류 발생',
        error,
      );
    }
  }

  private mapToEventData(eventDoc: Event | null): Event | null {
    if (!eventDoc) return null;

    let parsedCondition: EventCondition | undefined = undefined;
    if (eventDoc.condition) {
      if (typeof eventDoc.condition === 'string') {
        parsedCondition = JSON.parse(eventDoc.condition);
      } else if (typeof eventDoc.condition === 'object') {
        const cond = eventDoc.condition as any;
        parsedCondition = {
          category: cond.category,
          type: cond.type,
          operator: cond.operator,
          value: cond.value,
          unit: cond.unit,
          description: cond.description,
        };
      }
    }

    return {
      ...eventDoc,
      condition: parsedCondition,
    };
  }

  async save(event: Event): Promise<Event> {
    const createdEvent = new this.eventModel(event);
    return createdEvent.save();
  }
}
