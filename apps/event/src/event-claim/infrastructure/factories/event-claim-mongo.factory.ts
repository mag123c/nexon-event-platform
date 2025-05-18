import { Injectable } from '@nestjs/common';
import {
  EventClaimFactory,
  CreateEventClaimParams,
} from '@app/event/event-claim/domain/factories/event-claim.factory';
import { EventClaimData } from '@app/event/event-claim/domain/interfaces/event-claim-data.interface';

@Injectable()
export class EventClaimMongoFactory implements EventClaimFactory {
  create(params: CreateEventClaimParams): EventClaimData {
    const eventClaimDataObject = {
      userId: params.userId,
      eventId: params.eventId,
      status: params.status,
      grantedRewards: params.eligibleRewardsSnapshots.map((snapshot) => ({
        rewardId: snapshot.rewardId,
        name: snapshot.name,
        type: snapshot.type,
        details: snapshot.details,
      })),
      conditionCheckDetail: params.conditionCheckResult,
      failureReason: params.failureReason,
      requestedAt: params.requestedAt || new Date(),
      processedAt: params.processedAt,
      createdAt: new Date(),
    };

    return eventClaimDataObject as EventClaimData;
  }
}
