import { LoginUserInput } from '@app/auth/application/use-cases/login-user/login-user.input';
import { LoginUserOutput } from '@app/auth/application/use-cases/login-user/login-user.output';
import { LoginUserUseCase } from '@app/auth/application/use-cases/login-user/login-user.usecase';
import { RegisterUserInput } from '@app/auth/application/use-cases/register-user/register-user.input';
import { RegisterUserUseCase } from '@app/auth/application/use-cases/register-user/register-user.usecase';
import { User } from '@app/auth/user/domain/entities/user.entity';
import { LoginRequestDto } from '@app/auth/presentation/dtos/request/login-user.request.dto';
import { RegisterUserRequestDto } from '@app/auth/presentation/dtos/request/register-user.request.dto';
import { JwtResponseDto } from '@app/auth/presentation/dtos/response/jwt.response.dto';
import { UserResponseDto } from '@app/auth/presentation/dtos/response/user.response.dto';
import { ApiInternalHeaders } from '@app/common/decorators/api-internal-headers.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  loginUserExamples,
  registerUserExamples,
} from '@app/common/swagger/examples/auth.examples';

@ApiTags('Auth')
@ApiSecurity('x-internal-api-key')
@ApiInternalHeaders()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterUserRequestDto, examples: registerUserExamples })
  @ApiCreatedResponse({
    description: '회원가입 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (ex. 이미 존재하는 회원)',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error (ex. 비밀번호 암호화 실패, DB 오류)',
  })
  async register(
    @Body() registerUserRequestDto: RegisterUserRequestDto,
  ): Promise<UserResponseDto> {
    const useCaseInput: RegisterUserInput = {
      email: registerUserRequestDto.email,
      password: registerUserRequestDto.password,
      roles: registerUserRequestDto.roles,
      userActivity: registerUserRequestDto.userActivity,
    };

    const createdUserEntity: User =
      await this.registerUserUseCase.execute(useCaseInput);

    return UserResponseDto.fromEntity(createdUserEntity);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginRequestDto, examples: loginUserExamples })
  @ApiOkResponse({
    type: JwtResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (비밀번호 불일치 시).',
  })
  @ApiResponse({ status: 404, description: 'Not Found (사용자가 없을 때)' })
  async login(
    @Body() loginRequestDto: LoginRequestDto,
  ): Promise<JwtResponseDto> {
    const useCaseInput: LoginUserInput = {
      email: loginRequestDto.email,
      password: loginRequestDto.password,
    };

    const loginResult: LoginUserOutput =
      await this.loginUserUseCase.execute(useCaseInput);

    const responseDto: JwtResponseDto = {
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    };

    return responseDto;
  }
}
