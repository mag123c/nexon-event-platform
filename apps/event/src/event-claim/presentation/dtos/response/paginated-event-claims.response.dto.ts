import { ApiProperty } from '@nestjs/swagger';
import { EventClaimData } from '@app/event/event-claim/domain/interfaces/event-claim-data.interface';
import { ClaimRewardResponseDto } from '@app/event/event-claim/presentation/dtos/response/event-claim.response.dto';
import { EventClaim } from '@app/event/event-claim/domain/entities/event-claim.entity';

export class PaginatedEventClaimsResponseDto {
  @ApiProperty({ type: [ClaimRewardResponseDto] })
  items!: ClaimRewardResponseDto[];

  @ApiProperty() totalItems!: number;
  @ApiProperty() currentPage!: number;
  @ApiProperty() itemsPerPage!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPreviousPage!: boolean;

  static from(
    claimsData: EventClaimData[],
    totalCount: number,
    currentPage: number,
    itemsPerPage: number,
  ): PaginatedEventClaimsResponseDto {
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    return {
      items: claimsData.map((data) =>
        ClaimRewardResponseDto.fromEntity(data as EventClaim),
      ),
      totalItems: totalCount,
      currentPage: currentPage,
      itemsPerPage: itemsPerPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
