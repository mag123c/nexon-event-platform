import { User } from '@app/auth/user/domain/entities/user.entity';
import { UserNotFoundException } from '@app/auth/user/domain/errors/user.exception';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@app/auth/user/domain/ports/user.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}
  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(`User with ID ${userId} not found.`);
    }
    return user;
  }
}
