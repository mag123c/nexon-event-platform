import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.usecase';
import { RegisterUserInput } from './register-user.input';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/value-objects/role.vo';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../../../domain/ports/user.repository';
import { HashingPort, HASHING_PORT } from '../../../domain/ports/hasing.port';
import { UserAlreadyExistsException } from '../../../domain/errors/user-already-exists.exception';
import { Types } from 'mongoose';
import { HashingException } from '@app/auth/domain/errors/hasing.exception';
import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';

const mockUserRepository: jest.Mocked<UserRepository> = {
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  updateUser: jest.fn(),
};

const mockHashingService: jest.Mocked<HashingPort> = {
  hash: jest.fn(),
  compare: jest.fn(),
};

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: HASHING_PORT, useValue: mockHashingService },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
  });

  const validInput: RegisterUserInput = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('성공적인 가입', () => {
    it('새로운 사용자를 성공적으로 등록해야 한다', async () => {
      const hashedPassword = 'hashedPassword123';
      const expectedUser = new User();
      expectedUser._id = new Types.ObjectId();
      expectedUser.email = validInput.email;
      expectedUser.password = hashedPassword;
      expectedUser.roles = [Role.USER];

      mockUserRepository.findByEmail.mockResolvedValue(null); // 이메일 중복 없음
      mockHashingService.hash.mockResolvedValue(hashedPassword); // 해싱 성공
      mockUserRepository.save.mockResolvedValue(expectedUser); // 저장 성공 및 저장된 유저 반환

      const result = await useCase.execute(validInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(mockHashingService.hash).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInput.email,
          password: hashedPassword,
        }),
      );
      expect(result).toEqual(expectedUser);
      expect(result.roles).toContain(Role.USER); // 기본 역할 확인
    });
  });

  describe('이메일 중복 방지', () => {
    it('이미 존재하는 이메일로 가입 시 UserAlreadyExistsException을 던져야 한다', async () => {
      const existingUser = new User();
      existingUser.email = validInput.email;
      mockUserRepository.findByEmail.mockResolvedValue(existingUser); // 이미 사용자 존재

      await expect(useCase.execute(validInput)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(mockHashingService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('비밀번호 해싱 실패', () => {
    it('비밀번호 해싱 중 에러 발생 시 HashingException을 던져야 한다', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockHashingService.hash.mockRejectedValue(new Error('Hashing failed')); // 해싱 실패

      await expect(useCase.execute(validInput)).rejects.toThrow(
        HashingException,
      );
      expect(mockHashingService.hash).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('데이터베이스 저장 실패', () => {
    it('사용자 정보 저장 중 에러 발생 시 DatabaseOperationException을 던져야 한다', async () => {
      const hashedPassword = 'hashedPassword123';
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockHashingService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockRejectedValue(new Error('DB save failed')); // 저장 중 에러 발생

      await expect(useCase.execute(validInput)).rejects.toThrow(
        DatabaseOperationException,
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
