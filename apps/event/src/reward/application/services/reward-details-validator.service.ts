import { Injectable } from '@nestjs/common';
import {
  InvalidRewardDetailsException,
  UnsupportedRewardTypeException,
} from '@app/event/reward/domain/errors/reward.exception';
import { ItemRewardDetails } from '@app/event/reward/domain/entities/reward.entity';
import {
  RewardDetails,
  PointRewardDetails,
} from '@app/event/reward/domain/value-objects/reward-detail.vo';
import { RewardType } from '@app/event/reward/domain/value-objects/reward-type.vo';

@Injectable()
export class RewardDetailsValidatorService {
  validate(type: RewardType, details: RewardDetails): boolean {
    switch (type) {
      case RewardType.MILEAGE:
      case RewardType.NEXON_CASH:
        const pointDetails = details as PointRewardDetails;
        if (
          typeof pointDetails.amount !== 'number' ||
          isNaN(pointDetails.amount) ||
          pointDetails.amount <= 0
        ) {
          throw new InvalidRewardDetailsException(
            type,
            '필드 "amount"는 0보다 큰 숫자여야 합니다.',
          );
        }
        break;
      case RewardType.ITEM:
        const itemDetails = details as ItemRewardDetails;
        if (
          !itemDetails.itemId ||
          typeof itemDetails.itemId !== 'string' ||
          itemDetails.itemId.trim() === ''
        ) {
          throw new InvalidRewardDetailsException(
            type,
            '필드 "itemId"는 필수이며 빈 문자열일 수 없습니다.',
          );
        }
        if (
          typeof itemDetails.quantity !== 'number' ||
          isNaN(itemDetails.quantity) ||
          !Number.isInteger(itemDetails.quantity) ||
          itemDetails.quantity <= 0
        ) {
          throw new InvalidRewardDetailsException(
            type,
            '필드 "quantity"는 0보다 큰 정수여야 합니다.',
          );
        }
        break;
      default:
        throw new UnsupportedRewardTypeException(type);
    }
    return true;
  }
}
