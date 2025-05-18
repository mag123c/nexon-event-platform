import { User } from '@app/auth/user/domain/entities/user.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserActivityResponseDto {
  @ApiPropertyOptional({ type: Date })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ type: Number })
  loginStreakDays?: number;

  @ApiPropertyOptional({ type: Number })
  invitedFriendsCount?: number;

  @ApiPropertyOptional({ type: Number })
  joinedAt?: Date;

  static fromUserEntity(user: User): UserActivityResponseDto {
    const dto = new UserActivityResponseDto();
    const activity = user.activityData || {};

    dto.lastLoginAt = activity.lastLoginAt;
    dto.loginStreakDays = activity.loginStreakDays;
    dto.invitedFriendsCount = activity.invitedFriendIds?.length || 0;
    dto.joinedAt = activity.joinedAt;

    return dto;
  }
}
