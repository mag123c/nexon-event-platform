import { CreateRewardUseCase } from '../../application/use-cases/create-reward/create-reward.usecase';
import { CreateRewardInput } from '../../application/use-cases/create-reward/create-reward.input';
import { RewardResponseDto } from '@app/event/presentation/dtos/response/reward.response.dto';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRewardRequestDto } from '@app/event/presentation/dtos/request/reward.request.dto';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';

@ApiTags('Event - Rewards')
@ApiInternalHeaders()
@Controller('rewards')
export class RewardController {
  constructor(private readonly createRewardUseCase: CreateRewardUseCase) {}

  @Post(':eventId/rewards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '이벤트에 보상 생성' })
  @ApiBody({ type: CreateRewardRequestDto })
  @ApiCreatedResponse({
    description: '보상 생성 성공',
    type: RewardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (DTO 유효성, 비즈니스 규칙 위반 등)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (내부 API 키 누락/오류)',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (예: 일반 유저가 생성 시도)',
  })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '이미 동일한 보상 존재 (이름 또는 내용 기준)',
  })
  async createRewardForEvent(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreateRewardRequestDto,
    @InternalUser() currentUser: InternalUserContext,
  ): Promise<RewardResponseDto> {
    const useCaseInput: CreateRewardInput = {
      eventId: eventId,
      name: createRewardDto.name,
      description: createRewardDto.description,
      type: createRewardDto.type,
      details: createRewardDto.details,
      quantity: createRewardDto.quantity,
      createdBy: currentUser.id,
    };

    const createdReward = await this.createRewardUseCase.execute(useCaseInput);
    return RewardResponseDto.fromEntity(createdReward);
  }
}
