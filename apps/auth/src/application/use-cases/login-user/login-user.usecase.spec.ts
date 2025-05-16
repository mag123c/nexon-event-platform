import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseOperationException } from '@app/common/errors/database-operation.exception';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { LoginUserInput } from '@app/auth/application/use-cases/login-user/login-user.input';
import { LoginUserOutput } from '@app/auth/application/use-cases/login-user/login-user.output';
import { LoginUserUseCase } from '@app/auth/application/use-cases/login-user/login-user.usecase';
import { User } from '@app/auth/domain/entities/user.entity';
import { InvalidCredentialsException } from '@app/auth/domain/errors/invalid-credential.exception';
import { UserNotFoundException } from '@app/auth/domain/errors/user-not-found.exception';
import { HashingPort, HASHING_PORT } from '@app/auth/domain/ports/hasing.port';
import {
  TokenGeneratorPort,
  TOKEN_GENERATOR_PORT,
} from '@app/auth/domain/ports/token-generator.port';
import {
  UserRepository,
  USER_REPOSITORY,
} from '@app/auth/domain/ports/user.repository';
import { Role } from '@app/auth/domain/value-objects/role.vo';

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

const mockTokenGenerator: jest.Mocked<TokenGeneratorPort> = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_MS') {
      return (7 * 24 * 60 * 60 * 1000).toString();
    }
    return null;
  }),
};

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: HASHING_PORT, useValue: mockHashingService },
        { provide: TOKEN_GENERATOR_PORT, useValue: mockTokenGenerator },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
  });

  const validInput: LoginUserInput = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockUser = new User();
  mockUser._id = new Types.ObjectId();
  mockUser.email = validInput.email;
  mockUser.password = 'hashedCorrectPassword'; // DB에 저장된 해시된 비밀번호
  mockUser.roles = [Role.USER];

  describe('성공적인 로그인', () => {
    it('올바른 자격 증명으로 로그인 시 Access Token과 Refresh Token을 반환하고, DB에 Refresh Token 정보를 저장해야 한다', async () => {
      const accessToken = 'mockAccessToken';
      const plainRefreshToken = 'mockPlainRefreshToken';
      const hashedRefreshToken = 'mockHashedRefreshToken';

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockHashingService.compare.mockResolvedValue(true); // 비밀번호 일치
      mockTokenGenerator.generateAccessToken.mockResolvedValue(accessToken);
      mockTokenGenerator.generateRefreshToken.mockResolvedValue(
        plainRefreshToken,
      );
      mockHashingService.hash.mockResolvedValue(hashedRefreshToken); // Refresh Token 해싱
      mockUserRepository.updateUser.mockResolvedValue({
        _id: mockUser._id,
        email: mockUser.email,
        password: mockUser.password,
        roles: mockUser.roles,
        refreshToken: hashedRefreshToken,
        createdAt: new Date(),
      });

      const result = await useCase.execute(validInput);

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(mockHashingService.compare).toHaveBeenCalledWith(
        validInput.password,
        mockUser.password,
      );
      expect(mockTokenGenerator.generateAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(mockTokenGenerator.generateRefreshToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(mockHashingService.hash).toHaveBeenCalledWith(plainRefreshToken);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUser._id,
          refreshToken: hashedRefreshToken,
        }),
      );
      expect(result).toEqual<LoginUserOutput>({
        accessToken,
        refreshToken: plainRefreshToken,
      });
    });
  });

  describe('존재하지 않는 이메일', () => {
    it('존재하지 않는 이메일로 로그인 시도 시 UserNotFoundException을 던져야 한다', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null); // 사용자 없음

      await expect(useCase.execute(validInput)).rejects.toThrow(
        UserNotFoundException,
      );
      expect(mockHashingService.compare).not.toHaveBeenCalled();
      expect(mockTokenGenerator.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('잘못된 비밀번호', () => {
    it('잘못된 비밀번호로 로그인 시도 시 InvalidCredentialsException을 던져야 한다', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockHashingService.compare.mockResolvedValue(false); // 비밀번호 불일치

      await expect(useCase.execute(validInput)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockTokenGenerator.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('DB 업데이트 실패', () => {
    it('Refresh Token 정보 DB 업데이트 실패 시 DatabaseOperationException을 던져야 한다', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockHashingService.compare.mockResolvedValue(true);
      mockTokenGenerator.generateAccessToken.mockResolvedValue(
        'mockAccessToken',
      );
      mockTokenGenerator.generateRefreshToken.mockResolvedValue(
        'mockPlainRefreshToken',
      );
      mockHashingService.hash.mockResolvedValue('mockHashedRefreshToken');
      mockUserRepository.updateUser.mockRejectedValue(
        new DatabaseOperationException(),
      ); // DB 업데이트 실패

      await expect(useCase.execute(validInput)).rejects.toThrow(
        DatabaseOperationException,
      );
    });
  });
});
