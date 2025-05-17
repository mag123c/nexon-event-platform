import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { EventDocument } from '@app/event/domain/event/entities/event.entity';
import { EventRepository } from '@app/event/domain/event/ports/event.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '@app/event/domain/event/entities/event.entity';

@Injectable()
export class EventMongoRepository implements EventRepository {
  constructor(
    @InjectModel(Event.name, MONGO_CONNECTIONS.EVENT)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async findById(id: string): Promise<Event | null> {
    return this.eventModel.findById(id).exec();
  }

  async findByName(name: string): Promise<Event | null> {
    return this.eventModel.findOne({ name }).exec();
  }

  async findAll(): Promise<Event[]> {
    throw new Error('Method not implemented.');
  }

  async save(event: Event): Promise<Event> {
    const createdEvent = new this.eventModel(event);
    return createdEvent.save();
  }
}
