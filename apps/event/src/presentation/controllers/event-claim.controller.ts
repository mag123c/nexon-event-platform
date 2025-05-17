import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';
import { ClaimRewardInput } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.inupt';
import { ClaimRewardUseCase } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.usecase';
import { ClaimRewardRequestDto } from '@app/event/presentation/dtos/request/event-claim.request.dto';
import { ClaimRewardResponseDto } from '@app/event/presentation/dtos/response/event-claim.response.dto';
import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('Event - Claims')
@ApiInternalHeaders()
@Controller('claims')
export class EventClaimController {
  constructor(private readonly claimRewardUseCase: ClaimRewardUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '이벤트 보상 요청' })
  @ApiBody({ type: ClaimRewardRequestDto })
  @ApiCreatedResponse({
    description: '보상 요청 처리 완료 (성공 또는 예상된 실패 상태 포함)',
    type: ClaimRewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '보상 요청 기록 생성 성공',
    type: ClaimRewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 (DTO 유효성, 이벤트 상태 등)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패 (내부 API 키 누락/오류 등)',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 보상을 지급받음',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: '외부 서비스(Auth) 통신 오류',
  })
  async claimReward(
    @Body() claimRewardDto: ClaimRewardRequestDto,
    @InternalUser() currentUser: InternalUserContext,
  ): Promise<ClaimRewardResponseDto> {
    const useCaseInput: ClaimRewardInput = {
      userId: currentUser.id,
      eventId: claimRewardDto.eventId,
    };

    const eventClaim = await this.claimRewardUseCase.execute(useCaseInput);
    return ClaimRewardResponseDto.fromEntity(eventClaim);
  }
}
