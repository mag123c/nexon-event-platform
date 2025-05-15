import { RegisterUserInput } from '@app/auth/application/use-cases/register-user/register-user.input';
import { User } from '@app/auth/domain/entities/user.entity';
import { HashingException } from '@app/auth/domain/errors/hasing.exception';
import { UserAlreadyExistsException } from '@app/auth/domain/errors/user-already-exists.exception';
import { HASHING_PORT, HashingPort } from '@app/auth/domain/ports/hasing.port';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@app/auth/domain/ports/user.repository';
import { Injectable, Inject } from '@nestjs/common';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(input.email);
    }

    let hashedPassword: string;
    try {
      hashedPassword = await this.hashingService.hash(input.password);
    } catch (error: any) {
      throw new HashingException(
        '일련의 문제로 회원가입에 실패했습니다.',
        error,
      );
    }

    const newUser = new User();
    newUser.email = input.email;
    newUser.password = hashedPassword;

    try {
      return await this.userRepository.save(newUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '유저 정보를 저장하는 도중 문제가 발생했습니다.';
      throw new DatabaseOperationException(
        `회원 가입 실패. ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
