import { CreateRewardUseCase } from '../../application/use-cases/create-reward/create-reward.usecase';
import { CreateRewardInput } from '../../application/use-cases/create-reward/create-reward.input';
import { RewardResponseDto } from '@app/event/reward/presentation/dtos/response/reward.response.dto';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Body,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CreateRewardRequestDto } from '@app/event/reward/presentation/dtos/request/reward.request.dto';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ListRewardsQueryDto } from '@app/event/reward/presentation/dtos/request/list-rewards.query.dto';
import { ListRewardsByEventIdUseCase } from '@app/event/reward/application/use-cases/list-rewards-by-event-id/list-rewards-by-event-id.usecase';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { Role } from '@app/auth/domain/value-objects/role.vo';
import { CurrentUser } from '@app/gateway/auth/decorators/current-user.decorator';
import { InternalUserContext } from '@app/common/interfaces/internal-user-context.interface';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import { createRewardExamples } from '@app/common/swagger/examples/reward.example';

@ApiTags('Event - Rewards')
@ApiSecurity('x-internal-api-key')
@ApiInternalHeaders()
@Controller('rewards')
export class RewardController {
  constructor(
    private readonly createRewardUseCase: CreateRewardUseCase,
    private readonly listRewardsByEventIdUseCase: ListRewardsByEventIdUseCase,
  ) {}

  @Post(':eventId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: '이벤트에 보상 생성' })
  @ApiParam({
    name: 'eventId',
    type: String,
    description: '이벤트 ID',
  })
  @ApiSecurity('x-user-id')
  @ApiSecurity('x-user-roles')
  @ApiBody({ type: CreateRewardRequestDto, examples: createRewardExamples })
  @ApiCreatedResponse({
    description: '보상 생성 성공',
    type: RewardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 (DTO 유효성, 비즈니스 규칙 위반 등)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패 (필수 헤더 전달 누락)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (예: 일반 유저가 생성 시도)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '이벤트를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 동일한 보상 존재 (이름 또는 내용 기준)',
  })
  async createRewardForEvent(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreateRewardRequestDto,
    @CurrentUser() currentUser: InternalUserContext,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '특정 이벤트에 연결된 보상 목록 조회' })
  @ApiQuery({
    name: 'eventId',
    required: true,
    type: String,
    description: '이벤트 ID',
  })
  @ApiOkResponse({
    description: '보상 목록 조회 성공',
    type: [RewardResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 eventId의 이벤트를 찾을 수 없음',
  })
  async listRewardsForEvent(
    @Query() queryDto: ListRewardsQueryDto,
  ): Promise<RewardResponseDto[]> {
    const { rewards } = await this.listRewardsByEventIdUseCase.execute({
      eventId: queryDto.eventId,
    });
    return rewards.map((rewardData) =>
      RewardResponseDto.fromRewardData(rewardData),
    );
  }
}
