import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { EventDocument } from '@app/event/event-core/domain/entities/event.entity';
import { EventRepository } from '@app/event/event-core/domain/ports/event.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '@app/event/event-core/domain/entities/event.entity';

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

  async save(event: Event): Promise<Event> {
    const createdEvent = new this.eventModel(event);
    return createdEvent.save();
  }
}
