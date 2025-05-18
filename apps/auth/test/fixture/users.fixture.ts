import { Types } from 'mongoose';
import {
  User,
  UserActivityData,
} from '@app/auth/user/domain/entities/user.entity';
import { Role } from '@app/auth/domain/value-objects/role.vo';

export const createActivityDataFixture = (
  overrides: Partial<UserActivityData> = {},
): UserActivityData => {
  const now = new Date();
  return {
    loginStreakDays: 5,
    invitedFriendIds: [
      new Types.ObjectId().toHexString(),
      new Types.ObjectId().toHexString(),
    ],
    lastLoginAt: new Date(
      now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000,
    ),
    joinedAt: new Date(
      now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000,
    ),
    ...overrides,
  };
};

// 사용자 역할별 Fixture 정의
export const userA_Id_fixture = new Types.ObjectId();
export const userA_fixture: Omit<
  User,
  'password' | 'refreshToken' | 'createdAt' | 'updatedAt' | 'id' | '_id'
> & { _id: Types.ObjectId; password?: string } = {
  _id: userA_Id_fixture,
  email: 'user.a.e2e@example.com',
  roles: [Role.USER],
  activityData: createActivityDataFixture({
    loginStreakDays: 3,
    invitedFriendIds: [],
  }),
  password: 'hashedPasswordForUserA',
};

export const userB_Id_fixture = new Types.ObjectId();
export const userB_fixture: Omit<
  User,
  'password' | 'refreshToken' | 'createdAt' | 'updatedAt' | 'id' | '_id'
> & { _id: Types.ObjectId; password?: string } = {
  _id: userB_Id_fixture,
  email: 'user.b.e2e@example.com',
  roles: [Role.USER],
  activityData: createActivityDataFixture({
    loginStreakDays: 10,
    invitedFriendIds: ['friend1', 'friend2', 'friend3'],
  }),
  password: 'hashedPasswordForUserB',
};

export const operator_Id_fixture = new Types.ObjectId();
export const operatorUserFixture: Omit<
  User,
  'password' | 'refreshToken' | 'createdAt' | 'updatedAt' | 'id' | '_id'
> & { _id: Types.ObjectId; password?: string } = {
  _id: operator_Id_fixture,
  email: 'operator.e2e@example.com',
  roles: [Role.OPERATOR],
  activityData: createActivityDataFixture(),
  password: 'hashedPasswordForOperator',
};

export const auditor_Id_fixture = new Types.ObjectId();
export const auditorUserFixture: Omit<
  User,
  'password' | 'refreshToken' | 'createdAt' | 'updatedAt' | 'id' | '_id'
> & { _id: Types.ObjectId; password?: string } = {
  _id: auditor_Id_fixture,
  email: 'auditor.e2e@example.com',
  roles: [Role.AUDITOR],
  activityData: createActivityDataFixture(),
  password: 'hashedPasswordForAuditor',
};

export const admin_Id_fixture = new Types.ObjectId();
export const adminUserFixture: Omit<
  User,
  'password' | 'refreshToken' | 'createdAt' | 'updatedAt' | 'id' | '_id'
> & { _id: Types.ObjectId; password?: string } = {
  _id: admin_Id_fixture,
  email: 'admin.e2e@example.com',
  roles: [Role.ADMIN, Role.OPERATOR],
  activityData: createActivityDataFixture(),
  password: 'hashedPasswordForAdmin',
};

export const allUserFixturesForE2E = [
  userA_fixture,
  userB_fixture,
  operatorUserFixture,
  auditorUserFixture,
  adminUserFixture,
];
