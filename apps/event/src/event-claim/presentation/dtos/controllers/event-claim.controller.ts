import { Role } from '@app/auth/domain/value-objects/role.vo';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import {
  InternalUser,
  InternalUserContext,
} from '@app/common/decorators/internal-user.decorator';
import { ListMyEventClaimsUseCaseInput } from '@app/event/event-claim/application/use-cases/list-my-event-claims/list-my-event-claims.input';
import { ListMyEventClaimsUseCase } from '@app/event/event-claim/application/use-cases/list-my-event-claims/list-my-event-claims.usecase';
import { ClaimRewardInput } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.inupt';
import { ClaimRewardUseCase } from '@app/event/event-claim/application/use-cases/claim-reward/claim-reward.usecase';
import { ListMyEventClaimsQueryDto } from '@app/event/event-claim/presentation/dtos/request/list-my-event-claims.query.dto';
import { PaginatedEventClaimsResponseDto } from '@app/event/event-claim/presentation/dtos/response/paginated-event-claims.response.dto';
import { ClaimRewardResponseDto } from '@app/event/event-claim/presentation/dtos/response/event-claim.response.dto';
import { Roles } from '@app/gateway/auth/decorators/roles.decorator';
import { RolesGuard } from '@app/gateway/auth/guards/role.guard';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { ListAllEventClaimsUseCaseInput } from '@app/event/event-claim/application/use-cases/list-all-event-claims/list-all-event-claims.input';
import { ListAllEventClaimsQueryDto } from '@app/event/event-claim/presentation/dtos/request/list-all-event-claims.query.dto';
import { ListAllEventClaimsUseCase } from '@app/event/event-claim/application/use-cases/list-all-event-claims/list-all-event-claims.usecase';

@ApiTags('Event - Claims')
@ApiSecurity('x-internal-api-key')
@ApiInternalHeaders()
@Controller('claims')
export class EventClaimController {
  constructor(
    private readonly claimRewardUseCase: ClaimRewardUseCase,
    private readonly listMyEventClaimsUseCase: ListMyEventClaimsUseCase,
    private readonly listAllEventClaimsUseCase: ListAllEventClaimsUseCase,
  ) {}

  @Post(':eventId')
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('x-user-id')
  @ApiOperation({ summary: '이벤트 보상 요청' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID', type: String })
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
    @Param('eventId') eventId: string,
    @InternalUser() currentUser: InternalUserContext,
  ): Promise<ClaimRewardResponseDto> {
    const useCaseInput: ClaimRewardInput = {
      userId: currentUser.id,
      eventId,
    };

    const eventClaim = await this.claimRewardUseCase.execute(useCaseInput);
    return ClaimRewardResponseDto.fromEntity(eventClaim);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-user-id')
  @ApiSecurity('x-user-roles')
  @ApiOperation({ summary: '내 보상 요청 이력 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 보상 요청 이력 조회 성공',
    type: PaginatedEventClaimsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (USER 역할이 아님)',
  })
  async listMyClaims(
    @InternalUser() currentUser: InternalUserContext,
    @Query() queryDto: ListMyEventClaimsQueryDto,
  ): Promise<PaginatedEventClaimsResponseDto> {
    const useCaseInput: ListMyEventClaimsUseCaseInput = {
      requestingUserId: currentUser.id,
      eventId: queryDto.eventId,
      status: queryDto.status,
      requestedAtFrom: queryDto.requestedAtFrom
        ? new Date(queryDto.requestedAtFrom)
        : undefined,
      requestedAtTo: queryDto.requestedAtTo
        ? new Date(queryDto.requestedAtTo)
        : undefined,
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
    };

    const result = await this.listMyEventClaimsUseCase.execute(useCaseInput);

    return PaginatedEventClaimsResponseDto.from(
      result.claims,
      result.totalCount,
      result.currentPage,
      result.itemsPerPage,
    );
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR, Role.AUDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-user-id')
  @ApiSecurity('x-user-roles')
  @ApiOperation({
    summary: '전체 또는 필터링된 보상 요청 이력 조회 (관리자용)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '보상 요청 이력 조회 성공',
    type: PaginatedEventClaimsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않음',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async listAllClaims(
    @Query() queryDto: ListAllEventClaimsQueryDto,
  ): Promise<PaginatedEventClaimsResponseDto> {
    const useCaseInput: ListAllEventClaimsUseCaseInput = {
      userId: queryDto.userId, // 관리자는 userId로 필터링 가능
      eventId: queryDto.eventId,
      status: queryDto.status,
      requestedAtFrom: queryDto.requestedAtFrom
        ? new Date(queryDto.requestedAtFrom)
        : undefined,
      requestedAtTo: queryDto.requestedAtTo
        ? new Date(queryDto.requestedAtTo)
        : undefined,
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
    };

    const result = await this.listAllEventClaimsUseCase.execute(useCaseInput);

    return PaginatedEventClaimsResponseDto.from(
      result.claims,
      result.totalCount,
      result.currentPage,
      result.itemsPerPage,
    );
  }
}
