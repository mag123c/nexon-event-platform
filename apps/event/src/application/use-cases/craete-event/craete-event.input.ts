import { EventConditionInput } from '@app/event/application/use-cases/craete-event/event-condition.input';
import { EventStatus } from '@app/event/domain/event/value-objects/event-status.vo';

export interface CreateEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status?: EventStatus;
  conditions: EventConditionInput[];
  requiresManualApproval?: boolean;
  createdBy: string;
}
