import { User } from '@app/auth/user/domain/entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updateUser(user: User): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
