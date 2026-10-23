export type GqlOrderTrackingMetadata = {
  trackingId?: string | null;
  cancellationReason?: string | null;
  reviewText?: string | null;
  reviewRating?: number | null;
};

export type GqlOrderTrackingStage = {
  id: number;
  name: string;
  checked: boolean;
  date?: string | null;
  metadata?: GqlOrderTrackingMetadata | null;
};

export const ORDER_TRACKING_STAGE = {
  ORDER_PLACED: 1,
  PAYMENT_CONFIRMED: 2,
  ORDER_CONFIRMED: 3,
  PROCESSING: 4,
  PACKING: 5,
  DISPATCHING: 6,
  DELIVERED: 7,
  REVIEW: 8,
  CANCELLED: 9,
} as const;
