import { User } from '@app/auth/domain/entities/user.entity';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '60d5ec49e73c8c4d7c3f8b2a' })
  id!: string;

  @ApiProperty({ example: 'test@example.com' })
  email!: string;

  @ApiProperty({
    example: [Role.USER],
    enum: Role,
    isArray: true,
  })
  roles!: Role[];

  @ApiProperty({
    example: '2023-05-15T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    example: '2023-05-15T12:00:00.000Z',
  })
  updatedAt?: Date;

  static fromEntity(entity: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity._id.toHexString();
    dto.email = entity.email;
    dto.roles = entity.roles;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
