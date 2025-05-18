import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';

@Schema({ _id: false, timestamps: false })
export class EventCondition {
  @Prop({ required: true, type: String, enum: EventConditionCategory })
  category!: EventConditionCategory;

  @Prop({ required: true, type: String })
  type!: string;

  @Prop({ required: true, type: String, enum: EventConditionOperator })
  operator!: EventConditionOperator;

  @Prop({ required: true, type: Number })
  value!: number;

  @Prop({ type: String })
  unit?: string;

  @Prop({ type: String })
  description?: string;
}

export const EventConditionSchema =
  SchemaFactory.createForClass(EventCondition);
