import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import {
  EventCondition,
  EventConditionSchema,
} from '../embedded/event-condition.schema';
import { EventStatus } from '../value-objects/event-status.vo';

export type EventDocument = Event & Document;

@Schema({
  timestamps: true,
  collection: 'event',
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class Event {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, type: Date, index: true })
  startDate!: Date;

  @Prop({ required: true, type: Date, index: true })
  endDate!: Date;

  @Prop({
    required: true,
    type: String,
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
    index: true,
  })
  status: EventStatus = EventStatus.SCHEDULED;

  @Prop({ type: [EventConditionSchema], default: [] })
  conditions!: Types.DocumentArray<EventCondition>;

  @Prop({ type: Boolean, default: false })
  requiresManualApproval: boolean = false;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  updatedBy?: Types.ObjectId;

  createdAt!: Date;
  updatedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ name: 1, status: 1 });
