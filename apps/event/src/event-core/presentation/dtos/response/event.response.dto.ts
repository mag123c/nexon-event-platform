import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';

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

  @ApiProperty({ type: EventConditionResponseDto })
  condition!: EventConditionResponseDto;

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
    dto.condition = entity.condition;
    dto.requiresManualApproval = entity.requiresManualApproval;
    dto.createdBy = entity.createdBy.toHexString();
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.updatedBy = entity.updatedBy?.toHexString();
    return dto;
  }
}
