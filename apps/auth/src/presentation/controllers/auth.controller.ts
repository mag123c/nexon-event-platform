import { RegisterUserInput } from '@app/auth/application/use-cases/register-user/register-user.input';
import { RegisterUserUseCase } from '@app/auth/application/use-cases/register-user/register-user.usecase';
import { User } from '@app/auth/domain/entities/user.entity';
import { RegisterUserRequestDto } from '@app/auth/presentation/dtos/request/register-user.request.dto';
import { UserResponseDto } from '@app/auth/presentation/dtos/response/user.response.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterUserRequestDto })
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
    };

    const createdUserEntity: User =
      await this.registerUserUseCase.execute(useCaseInput);

    return UserResponseDto.fromEntity(createdUserEntity);
  }
}
