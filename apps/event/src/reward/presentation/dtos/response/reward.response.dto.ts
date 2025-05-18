import {
  RewardDetailsUnion,
  Reward,
} from '@app/event/reward/domain/entities/reward.entity';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RewardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: RewardType })
  type!: RewardType;

  @ApiProperty({ description: '보상 타입별 상세 정보' })
  details!: RewardDetailsUnion;

  @ApiPropertyOptional({ type: Number, nullable: true })
  quantity?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  remainingQuantity?: number | null;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  static fromEntity(entity: Reward): RewardResponseDto {
    const dto = new RewardResponseDto();
    dto.id = entity._id.toHexString();
    dto.eventId = entity.eventId.toHexString();
    dto.name = entity.name;
    dto.description = entity.description;
    dto.type = entity.type;
    dto.details = entity.details;
    dto.quantity = entity.quantity;
    dto.remainingQuantity = entity.remainingQuantity;
    dto.createdBy = entity.createdBy.toHexString();
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromRewardData(data: Reward): RewardResponseDto {
    const dto = new RewardResponseDto();
    dto.id = data._id.toHexString();
    dto.eventId = data.eventId.toHexString();
    dto.name = data.name;
    return dto;
  }
}
