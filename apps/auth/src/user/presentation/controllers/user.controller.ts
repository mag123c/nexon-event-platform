import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { UserActivityResponseDto } from '../dtos/response/user-activity.response.dto';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import { GetUserUseCase } from '@app/auth/user/application/use-cases/get-user/get-user.usecase';
import { User } from '@app/auth/user/domain/entities/user.entity';

@ApiTags('Users (Internal Operations)')
@ApiSecurity('x-internal-api-key')
@ApiSecurity('x-user-id')
@ApiInternalHeaders()
@Controller('users')
export class UserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  @Get('activity-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '특정 유저의 활동 데이터 조회 (내부 서비스용)' })
  @ApiParam({
    name: 'userId',
    description: '조회할 유저의 ID (ObjectId string)',
    type: String,
  })
  @ApiOkResponse({
    type: UserActivityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '유저를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API 키 인증 실패',
  })
  async getUserActivityData(
    @Param('userId') userId: string,
  ): Promise<UserActivityResponseDto> {
    const user: User = await this.getUserUseCase.execute(userId);
    return UserActivityResponseDto.fromUserEntity(user);
  }
}
