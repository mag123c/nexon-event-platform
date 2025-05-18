import { Event } from '@app/event/event-core/domain/entities/event.entity';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ApiProperty } from '@nestjs/swagger';

export class EventSummaryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty({ enum: EventStatus }) status!: EventStatus;

  static fromEventData(data: Event): EventSummaryResponseDto {
    return {
      id: data._id.toHexString(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    };
  }
}
