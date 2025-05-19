import { Role } from '@app/auth/domain/value-objects/role.vo';
import { LoginRequestDto } from '@app/auth/presentation/dtos/request/login-user.request.dto';
import { RegisterUserRequestDto } from '@app/auth/presentation/dtos/request/register-user.request.dto';
import { UserActivityData } from '@app/auth/user/domain/entities/user.entity';

interface ApiExample {
  summary?: string;
  description?: string;
  value: any;
  externalValue?: string;
}

export const registerUserExamples: Record<string, ApiExample> = {
  userRegistration: {
    summary: '일반 사용자 회원가입',
    value: {
      email: 'new.user@example.com',
      password: 'password123',
      roles: [Role.USER],
    } as RegisterUserRequestDto,
  },
  adminRegistration: {
    summary: '관리자 계정 생성 (ADMIN 역할 포함)',
    value: {
      email: 'admin.user@example.com',
      password: 'securePasswordAdmin',
      roles: [Role.ADMIN, Role.USER],
    } as RegisterUserRequestDto,
  },
  operatorRegistration: {
    summary: '운영자 계정 생성',
    value: {
      email: 'operator.user@example.com',
      password: 'securePasswordOperator',
      roles: [Role.OPERATOR, Role.USER],
    } as RegisterUserRequestDto,
  },
  auditorRegistration: {
    summary: '감사자 계정 생성',
    value: {
      email: 'auditor.user@example.com',
      password: 'securePasswordAuditor',
      roles: [Role.AUDITOR, Role.USER],
    } as RegisterUserRequestDto,
  },
  userForImmediateReward: {
    summary: '특정 조건 만족 유저 (보상 바로 수령 가능 테스트용)',
    description:
      '친구 100명 초대, 로그인 연속 100일, 마지막 로그인은 1년 전으로 설정된 유저',
    value: {
      email: 'reward.ready.user@example.com',
      password: 'password123Reward',
      roles: [Role.USER],
      userActivity: {
        loginStreakDays: 100,
        invitedFriendIds: Array.from(
          { length: 100 },
          (_, i) => `friend_id_${i + 1}`,
        ),
        lastLoginAt: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(),
      } as UserActivityData,
    } as RegisterUserRequestDto,
  },
};

export const loginUserExamples: Record<string, ApiExample> = {
  userLogin: {
    summary: '일반 사용자 로그인',
    value: {
      email: 'new.user@example.com',
      password: 'password123',
    } as LoginRequestDto,
  },
  adminLogin: {
    summary: '관리자 로그인',
    value: {
      email: 'admin.user@example.com',
      password: 'securePasswordAdmin',
    } as LoginRequestDto,
  },
  opeartorLogin: {
    summary: '운영자 로그인',
    value: {
      email: 'operator.user@example.com',
      password: 'securePasswordOperator',
    } as LoginRequestDto,
  },
  auditorLogin: {
    summary: '감사자 로그인',
    value: {
      email: 'auditor.user@example.com',
      password: 'securePasswordAuditor',
    } as LoginRequestDto,
  },
  userForImmediateReward: {
    summary: '특정 조건 만족 유저 (보상 바로 수령 가능 테스트용)',
    description:
      '친구 100명 초대, 로그인 연속 100일, 마지막 로그인은 1년 전으로 설정된 유저',
    value: {
      email: 'reward.ready.user@example.com',
      password: 'password123Reward',
    } as LoginRequestDto,
  },
};
