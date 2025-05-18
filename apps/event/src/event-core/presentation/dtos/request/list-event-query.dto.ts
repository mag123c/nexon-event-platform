import { BasePaginationOptions } from '@app/common/database/moongoose/utils/pagination.utils';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListEventsQueryDto implements BasePaginationOptions {
  @ApiPropertyOptional({ description: '이벤트 이름 (부분 일치 검색)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EventStatus, description: '이벤트 상태' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

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

  @ApiPropertyOptional({ description: '정렬 기준 필드', example: 'createdAt' })
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
