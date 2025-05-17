import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo';
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';

export class EventConditionDto {
  @ApiProperty({
    enum: EventConditionCategory,
    example: EventConditionCategory.USER_ACTIVITY,
  })
  @IsNotEmpty()
  @IsEnum(EventConditionCategory)
  category!: EventConditionCategory;

  @ApiProperty({ example: 'LOGIN_COUNT' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({
    enum: EventConditionOperator,
    example: EventConditionOperator.GREATER_THAN_OR_EQUAL,
  })
  @IsNotEmpty()
  @IsEnum(EventConditionOperator)
  operator!: EventConditionOperator;

  @ApiProperty({
    example: 10,
    description: '어떤 값을 비교할지에 대한 값',
  })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ example: 'days', description: '단위' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: '10회 이상 로그인',
    description: '조건 설명',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEventRequestDto {
  @ApiProperty({ example: '출석 체크 이벤트', minLength: 3, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '매일 출석하고 보상 받으세요!' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: '이벤트 시작일',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: new Date().toISOString() + 1000 * 60 * 60 * 24,
    description: '이벤트 종료일 (default: 1일 후)',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    description: '테스트를 위해 default는 ACTIVE로 설정',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({
    type: [EventConditionDto],
    description: '이벤트 달성 조건 목록',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventConditionDto)
  @ArrayMinSize(1)
  conditions: EventConditionDto[] = [];

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresManualApproval?: boolean;
}
