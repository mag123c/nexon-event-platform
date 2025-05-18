import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@app/common/errors/base.error';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';

export class EventNotFoundForRewardException extends BaseError {
  constructor(eventId: string) {
    super(
      HttpStatus.NOT_FOUND,
      `보상을 추가하려는 이벤트를 찾을 수 없습니다. (Event ID: ${eventId})`,
      { eventId },
      'warn',
    );
  }
}

export class InvalidRewardQuantityException extends BaseError {
  constructor(message: string = '보상 수량이 유효하지 않습니다.') {
    super(HttpStatus.BAD_REQUEST, message, undefined, 'warn');
  }
}

export class UnsupportedRewardTypeException extends BaseError {
  constructor(typeAttempted: string) {
    super(
      HttpStatus.BAD_REQUEST,
      `지원하지 않는 보상 타입입니다: ${typeAttempted}. 지원 타입: ${Object.values(RewardType).join(', ')}`,
      { typeAttempted, supportedTypes: Object.values(RewardType) },
      'warn',
    );
  }
}

export class InvalidRewardDetailsException extends BaseError {
  constructor(type: RewardType, reason: string, detailsReceived?: any) {
    super(
      HttpStatus.BAD_REQUEST,
      `보상 타입 [${type}]에 대한 상세 정보(details)가 유효하지 않습니다: ${reason}`,
      { rewardType: type, reason, detailsReceived },
      'warn',
    );
  }
}

export class RewardAlreadyExistsInEventException extends BaseError {
  constructor(eventId: string, rewardName: string) {
    super(
      HttpStatus.CONFLICT,
      `이벤트 [${eventId}]에 이미 동일한 이름의 보상이 존재합니다: ${rewardName}`,
      { eventId, rewardName },
      'warn',
    );
  }
}
