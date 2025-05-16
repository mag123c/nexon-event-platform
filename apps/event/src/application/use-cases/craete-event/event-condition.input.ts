import { EventConditionCategory } from '@app/event/domain/event/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/domain/event/value-objects/event-condition-operator.vo';

export interface EventConditionInput {
  category: EventConditionCategory;
  type: string;
  operator: EventConditionOperator;
  value: any;
  unit?: string;
  description?: string;
}
