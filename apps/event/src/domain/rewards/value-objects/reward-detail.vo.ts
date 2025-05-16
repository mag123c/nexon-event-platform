export interface PointRewardDetails {
  amount: number;
}

export interface ItemRewardDetails {
  itemId: string;
  itemName?: string;
  quantity: number;
}

export interface CouponRewardDetails {
  couponCodePrefix?: string;
  couponId?: string;
  discountValue: number;
  discountUnit: string;
  validFrom?: Date;
  validUntil?: Date;
}

export type RewardDetails =
  | PointRewardDetails
  | ItemRewardDetails
  | CouponRewardDetails
  | Record<string, any>;
