import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';

class EventConditionDetailDto implements EventCondition {
  @ApiProperty() category!: any;
  @ApiProperty() type!: string;
  @ApiProperty() operator!: any;
  @ApiProperty() value!: number;
  @ApiPropertyOptional() unit?: string;
  @ApiPropertyOptional() description?: string;
}

export class EventDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty({ enum: EventStatus }) status!: EventStatus;
  @ApiPropertyOptional({ type: EventConditionDetailDto })
  condition?: EventConditionDetailDto;
  @ApiProperty() requiresManualApproval!: boolean;
  @ApiProperty() createdBy!: string;
  @ApiPropertyOptional() updatedBy?: string;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional() updatedAt?: Date;

  static fromEventData(data: Event): EventDetailResponseDto {
    return {
      id: data._id.toHexString(),
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      condition: data.condition
        ? {
            category: data.condition.category,
            type: data.condition.type,
            operator: data.condition.operator,
            value: data.condition.value,
            unit: data.condition.unit,
            description: data.condition.description,
          }
        : undefined,
      requiresManualApproval: data.requiresManualApproval,
      createdBy: data.createdBy.toString(),
      updatedBy: data.updatedBy?.toString(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
