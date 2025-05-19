import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';
import { Type } from 'class-transformer';

export class RegisterUserRequestDto {
  @ApiProperty({ example: 'test@example.com', description: '이메일' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    enum: Role,
    isArray: true,
    required: false,
    example: [Role.ADMIN, Role.USER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({
    example: {
      loginStreakDays: 5,
      invitedFriendIds: ['friend1', 'friend2'],
      lastLoginAt: new Date(),
      joinedAt: new Date(),
    },
  })
  @IsOptional()
  @Type(() => UserActivityData)
  userActivity?: UserActivityData;
}
