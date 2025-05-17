import { BaseError } from '@app/common';
import { HttpStatus } from '@nestjs/common';

export class EventNotFoundForClaimException extends BaseError {
  constructor(eventId: string) {
    super(
      HttpStatus.NOT_FOUND,
      `보상을 요청하려는 이벤트를 찾을 수 없습니다. (Event ID: ${eventId})`,
      { eventId },
    );
  }
}

export class EventNotClaimableException extends BaseError {
  constructor(eventId: string, reason: string) {
    super(
      HttpStatus.BAD_REQUEST,
      `해당 이벤트는 현재 보상을 요청할 수 없는 상태입니다 (Event ID: ${eventId}). 이유: ${reason}`,
      { eventId, reason },
    );
  }
}

export class AlreadyClaimedException extends BaseError {
  constructor(userId: string, eventId: string) {
    super(
      HttpStatus.CONFLICT,
      `이미 해당 이벤트에 대한 보상을 지급받았습니다. (User ID: ${userId}, Event ID: ${eventId})`,
      { userId, eventId },
    );
  }
}

export class ConditionsNotMetException extends BaseError {
  constructor(eventId: string, details?: string | object) {
    super(
      HttpStatus.BAD_REQUEST,
      `이벤트 조건을 충족하지 못했습니다. (Event ID: ${eventId})`,
      { eventId, details },
    );
  }
}

/**
 * 보상이 없음.
 */
export class NoRewardsAvailableException extends BaseError {
  constructor(eventId: string) {
    super(
      HttpStatus.OK,
      `지급 가능한 보상이 없습니다. 모든 보상이 소진되었거나 지급 대상이 아닙니다. (Event ID: ${eventId})`,
      { eventId },
    );
  }
}
