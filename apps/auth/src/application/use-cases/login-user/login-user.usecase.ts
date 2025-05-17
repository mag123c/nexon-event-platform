import { Inject, Injectable } from '@nestjs/common';
import { LoginUserInput } from './login-user.input';
import { LoginUserOutput } from './login-user.output';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../../../user/domain/ports/user.repository';
import { HashingPort, HASHING_PORT } from '../../../domain/ports/hasing.port';
import {
  TokenGeneratorPort,
  TOKEN_GENERATOR_PORT,
} from '../../../domain/ports/token-generator.port';
import { InvalidCredentialsException } from '@app/auth/domain/errors/invalid-credential.exception';
import { UserNotFoundException } from '@app/auth/user/domain/errors/user.exception';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
    @Inject(TOKEN_GENERATOR_PORT)
    private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmailWithPassword(input.email);
    if (!user) {
      throw new UserNotFoundException(input.email);
    }

    // 비밀번호 비교
    const isPasswordMatching = await this.hashingService.compare(
      input.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new InvalidCredentialsException();
    }

    // Access Token 생성
    const accessToken = await this.tokenGenerator.generateAccessToken(user);

    // Refresh Token 생성 및 DB 저장
    const plainRefreshToken =
      await this.tokenGenerator.generateRefreshToken(user);
    const hashedRefreshToken =
      await this.hashingService.hash(plainRefreshToken);

    // DB에 해시된 Refresh Token 저장
    user.refreshToken = hashedRefreshToken;
    await this.userRepository.updateUser(user);

    return {
      accessToken,
      refreshToken: plainRefreshToken, // 클라이언트에게는 평문 리프레시 토큰 전달
    };
  }
}
