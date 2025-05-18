import { EventConditionInput } from '@app/event/event-core/application/use-cases/craete-event/event-condition.input';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';

export interface CreateEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status?: EventStatus;
  condition: EventConditionInput;
  requiresManualApproval?: boolean;
  createdBy: string;
}
