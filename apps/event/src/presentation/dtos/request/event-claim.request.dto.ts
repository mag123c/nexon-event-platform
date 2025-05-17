import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ClaimRewardRequestDto {
  @ApiProperty({
    example: '60f7e9b9c9b8a3a0a0a0a0a0',
    description: '보상을 요청하는 이벤트의 ID',
    required: true,
  })
  @IsNotEmpty({ message: '이벤트 ID는 필수입니다.' })
  @IsString({ message: '이벤트 ID는 문자열이어야 합니다.' })
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  eventId!: string;
}
