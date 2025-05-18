import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ListRewardsQueryDto {
  @ApiProperty({
    description: '보상 목록을 조회할 이벤트의 ID',
    example: '60f7e9b9c9b8a3a0a0a0a0a0',
  })
  @IsNotEmpty()
  @IsMongoId()
  eventId!: string;
}
