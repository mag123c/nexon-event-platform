import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';

export class CreateRewardRequestDto {
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

  /**
   * 세부 벨리데이션은 벨리데이션서비스에서 처리
   * @see RewardDetailsValidatorService
   * @ese apps/event/src/application/services/reward-details-validator.service.ts)
   */
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
    description: '총 지급 가능 수량 (null/undefined = 무제한)',
  })
  @IsOptional()
  @IsNumber({}, { message: '보상 수량은 숫자여야 합니다.' })
  @IsInt({ message: '보상 수량은 정수여야 합니다.' })
  @Min(0, { message: '보상 수량은 0 이상이어야 합니다.' })
  quantity?: number | null;
}
