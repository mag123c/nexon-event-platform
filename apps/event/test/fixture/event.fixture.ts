import { Types } from 'mongoose';
import { EventStatus } from '@app/event/event-core/domain/value-objects/event-status.vo'; // 실제 경로로
import { EventConditionCategory } from '@app/event/event-core/domain/value-objects/event-condition-category.vo'; // 실제 경로로
import { EventConditionOperator } from '@app/event/event-core/domain/value-objects/event-condition-operator.vo'; // 실제 경로로
import { EventCondition } from '@app/event/event-core/domain/embedded/event-condition.schema';
import { Event } from '@app/event/event-core/domain/entities/event.entity';

const conditionFixtures: EventCondition[] = [
  {
    category: EventConditionCategory.USER_ACTIVITY,
    type: 'LOGIN_STREAK_DAYS',
    operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
    value: 5,
    unit: 'days',
    description: '최근 일주일간 5회 이상 로그인',
  },
  {
    category: EventConditionCategory.USER_ACTIVITY,
    type: 'INVITED_FRIENDS_COUNT',
    operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
    value: 3,
    unit: 'people',
    description: '친구 3명 이상 초대 완료',
  },
  {
    category: EventConditionCategory.USER_PROFILE,
    type: 'JOIN_DATE',
    operator: EventConditionOperator.GREATER_THAN_OR_EQUAL,
    value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime(),
    description: '가입 후 7일 이내 신규 유저 (value는 timestamp로 가정)',
  },
  {
    category: EventConditionCategory.USER_ACTIVITY,
    type: 'LAST_LOGIN_AT',
    operator: EventConditionOperator.LESS_THAN_OR_EQUAL,
    value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime(),
    description:
      '마지막 접속 후 30일 이상 경과한 복귀 유저 (value는 timestamp로 가정)',
  },
  undefined,
] as any;

const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start: Date, end: Date): Date =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export function generateRandomEventData(
  index: number,
): Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'id'> {
  const now = new Date();
  const createdBy = new Types.ObjectId();

  const statuses = Object.values(EventStatus);
  const randomStatus = getRandomElement(statuses);

  let startDate: Date;
  let endDate: Date;

  switch (randomStatus) {
    case EventStatus.SCHEDULED:
      startDate = getRandomDate(
        new Date(now.getTime() + 86400000),
        new Date(now.getTime() + 7 * 86400000),
      );
      endDate = getRandomDate(
        new Date(startDate.getTime() + 86400000),
        new Date(startDate.getTime() + 14 * 86400000),
      );
      break;
    case EventStatus.ACTIVE:
      startDate = getRandomDate(new Date(now.getTime() - 7 * 86400000), now);
      endDate = getRandomDate(
        new Date(now.getTime() + 86400000),
        new Date(now.getTime() + 7 * 86400000),
      );
      break;
    case EventStatus.INACTIVE:
      startDate = getRandomDate(
        new Date(now.getTime() - 14 * 86400000),
        new Date(now.getTime() - 7 * 86400000),
      );
      endDate = getRandomDate(new Date(now.getTime() - 6 * 86400000), now);
      break;
    case EventStatus.ENDED:
      endDate = getRandomDate(
        new Date(now.getTime() - 7 * 86400000),
        new Date(now.getTime() - 86400000),
      );
      startDate = getRandomDate(
        new Date(endDate.getTime() - 14 * 86400000),
        endDate,
      );
      break;
    default:
      startDate = now;
      endDate = new Date(now.getTime() + 86400000);
  }

  const randomCondition = getRandomElement(conditionFixtures);

  return {
    name: `랜덤 이벤트 ${index + 1} (${randomStatus})`,
    description: `이것은 랜덤하게 생성된 ${index + 1}번째 이벤트의 설명입니다.`,
    startDate,
    endDate,
    status: randomStatus,
    condition: randomCondition,
    requiresManualApproval: Math.random() < 0.3,
    createdBy,
  };
}

export function generateNRandomEventData(
  count: number,
): Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'id'>[] {
  const events: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'id'>[] = [];
  for (let i = 0; i < count; i++) {
    events.push(generateRandomEventData(i));
  }
  return events;
}
