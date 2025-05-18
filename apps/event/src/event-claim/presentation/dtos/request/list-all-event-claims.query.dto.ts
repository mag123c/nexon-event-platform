import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimStatus } from '@app/event/event-claim/domain/entities/event-claim.entity';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';

export class ListAllEventClaimsQueryDto implements BasePaginationOptions {
  @ApiPropertyOptional({ description: '필터링할 유저의 ID' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ description: '필터링할 이벤트의 ID' })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiPropertyOptional({
    enum: ClaimStatus,
    description: '필터링할 클레임 상태',
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiPropertyOptional({
    description: '요청일 검색 시작 (YYYY-MM-DDTHH:mm:ss.sssZ)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  requestedAtFrom?: string;

  @ApiPropertyOptional({
    description: '요청일 검색 종료 (YYYY-MM-DDTHH:mm:ss.sssZ)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  requestedAtTo?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 아이템 수',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: '정렬 기준 필드 (예: requestedAt)',
    example: 'requestedAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '정렬 순서 (asc 또는 desc)',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
