import { ApiProperty } from '@nestjs/swagger';
import { EventSummaryResponseDto } from './event-summary.response.dto';
import { Event } from '@app/event/event-core/domain/entities/event.entity';

export class PaginatedEventsResponseDto {
  @ApiProperty({ type: [EventSummaryResponseDto] })
  items!: EventSummaryResponseDto[];

  @ApiProperty() totalItems!: number;
  @ApiProperty() currentPage!: number;
  @ApiProperty() itemsPerPage!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPreviousPage!: boolean;

  static from(
    eventsData: Event[],
    totalCount: number,
    page: number = 1,
    limit: number = 10,
  ): PaginatedEventsResponseDto {
    const totalPages = Math.ceil(totalCount / limit);
    return {
      items: eventsData.map(EventSummaryResponseDto.fromEventData),
      totalItems: totalCount,
      currentPage: page,
      itemsPerPage: limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
