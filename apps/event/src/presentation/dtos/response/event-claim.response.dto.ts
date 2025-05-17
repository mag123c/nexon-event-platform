import {
  ClaimStatus,
  EventClaim,
} from '@app/event/domain/event-claim/entities/event-claim.entity';
import { RewardDetailsUnion } from '@app/event/domain/reward/entities/reward.entity';
import { RewardType } from '@app/event/domain/reward/value-objects/reward-type.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GrantedRewardDto {
  @ApiProperty()
  rewardId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: RewardType })
  type!: RewardType;

  @ApiProperty({ description: '지급된 보상의 상세 정보' })
  details!: RewardDetailsUnion;
}

class ConditionCheckResultDto {
  @ApiProperty()
  conditionType!: string;

  @ApiProperty()
  targetValue!: any;

  @ApiProperty()
  actualValue!: any;

  @ApiProperty()
  isMet!: boolean;

  @ApiProperty()
  checkedAt!: Date;

  @ApiPropertyOptional()
  message?: string;
}

export class ClaimRewardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty({ enum: ClaimStatus })
  status!: ClaimStatus;

  @ApiPropertyOptional({ type: [GrantedRewardDto] })
  grantedRewards?: GrantedRewardDto[];

  @ApiPropertyOptional({ type: [ConditionCheckResultDto] })
  conditionCheckDetails?: ConditionCheckResultDto[];

  @ApiPropertyOptional()
  failureReason?: string;

  @ApiProperty()
  requestedAt!: Date;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt?: Date;

  static fromEntity(entity: EventClaim): ClaimRewardResponseDto {
    const dto = new ClaimRewardResponseDto();
    dto.id = entity.id.toHexString();
    dto.userId = entity.userId?.toHexString() ?? '';
    dto.eventId = entity.eventId?.toHexString() ?? '';
    dto.status = entity.status;

    dto.grantedRewards = entity.grantedRewards?.map((gr) => ({
      rewardId: gr.rewardId.toHexString(),
      name: gr.name,
      type: gr.type,
      details: gr.details,
    }));

    dto.conditionCheckDetails = entity.conditionCheckDetails?.map((cd) => ({
      conditionType: cd.conditionType,
      targetValue: cd.targetValue,
      actualValue: cd.actualValue,
      isMet: cd.isMet,
      checkedAt: cd.checkedAt,
      message: (cd as any).message,
    }));

    dto.failureReason = entity.failureReason;
    dto.requestedAt = entity.requestedAt;
    dto.processedAt = entity.processedAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
