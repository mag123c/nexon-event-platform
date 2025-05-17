import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsMongoId,
  IsNumber,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';

export class CreateRewardRequestDto {
  @ApiProperty({
    example: 'event-object-id-string',
    description: '보상이 속할 이벤트의 ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  eventId!: string;

  @ApiProperty({
    example: '데일리 출석 보상 - 1000 마일리지',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: '매일 출석하는 유저에게 지급되는 마일리지입니다.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: RewardType, example: RewardType.MILEAGE })
  @IsNotEmpty()
  @IsEnum(RewardType)
  type!: RewardType;

  @ApiProperty({
    example: { amount: 1000 },
    description:
      '보상 타입에 따른 상세 정보 (예: MILEAGE 타입이면 { amount: 1000 })',
  })
  @IsNotEmpty()
  @IsObject()
  details!: Record<string, any>;

  @ApiPropertyOptional({
    example: 100,
    description: '총 지급 가능 수량 (null 또는 없으면 무제한)',
  })
  @IsOptional()
  @IsNumber({}, { message: '보상 수량은 숫자여야 합니다.' })
  @IsInt({ message: '보상 수량은 정수여야 합니다.' })
  @Min(0, { message: '보상 수량은 0 이상이어야 합니다.' })
  quantity?: number | null;
}
