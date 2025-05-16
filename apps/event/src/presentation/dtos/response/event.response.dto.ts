import { EventStatus } from '@app/event/domain/event/value-objects/event-status.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '@app/event/domain/event/entities/event.entity';
import { EventConditionCategory } from '@app/event/domain/event/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/domain/event/value-objects/event-condition-operator.vo';

class EventConditionResponseDto {
  @ApiProperty({ enum: EventConditionCategory })
  category!: EventConditionCategory;
  @ApiProperty()
  type!: string;
  @ApiProperty({ enum: EventConditionOperator })
  operator!: EventConditionOperator;
  @ApiProperty()
  value: any;
  @ApiPropertyOptional()
  unit?: string;
  @ApiPropertyOptional()
  description?: string;
}

export class EventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty({ enum: EventStatus })
  status!: EventStatus;

  @ApiProperty({ type: [EventConditionResponseDto] })
  conditions!: EventConditionResponseDto[];

  @ApiProperty()
  requiresManualApproval!: boolean;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiProperty()
  updatedBy?: string;

  static fromEntity(entity: Event): EventResponseDto {
    const dto = new EventResponseDto();
    dto.id = entity._id.toHexString();
    dto.name = entity.name;
    dto.description = entity.description;
    dto.startDate = entity.startDate;
    dto.endDate = entity.endDate;
    dto.status = entity.status;
    dto.conditions = entity.conditions.map((c) => ({
      category: c.category,
      type: c.type,
      operator: c.operator,
      value: c.value,
      unit: c.unit,
      description: c.description,
    }));
    dto.requiresManualApproval = entity.requiresManualApproval;
    dto.createdBy = entity.createdBy.toHexString();
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.updatedBy = entity.updatedBy?.toHexString();
    return dto;
  }
}
