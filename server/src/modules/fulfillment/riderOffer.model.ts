import mongoose, { Schema, type Document, type Types } from "mongoose";

export type RiderOfferStatus = "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export const MAX_RIDER_REJECTIONS_PER_SUB_ORDER = 3;

export interface IRiderOffer extends Document {
  offerId: string;
  subOrderObjectId: Types.ObjectId;
  subOrderId: string;
  parentOrderId?: Types.ObjectId;
  sellerId?: Types.ObjectId;
  riderId: Types.ObjectId;
  riderProfileId: Types.ObjectId;
  status: RiderOfferStatus;
  stage: number;
  radiusKm: number;
  payoutAmount: number;
  distanceKm?: number;
  riderDistanceToStoreKm?: number;
  expiresAt: Date;
  respondedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const offerId = () => `offer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const riderOfferSchema = new Schema<IRiderOffer>(
  {
    offerId: { type: String, required: true, unique: true, index: true, default: offerId },
    subOrderObjectId: { type: Schema.Types.ObjectId, ref: "SubOrder", required: true, index: true },
    subOrderId: { type: String, required: true, index: true },
    parentOrderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    riderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    riderProfileId: { type: Schema.Types.ObjectId, ref: "DeliveryBoy", required: true, index: true },
    status: {
      type: String,
      enum: ["OPEN", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    stage: { type: Number, required: true, min: 1, max: 4 },
    radiusKm: { type: Number, required: true },
    payoutAmount: { type: Number, required: true, min: 0 },
    distanceKm: Number,
    riderDistanceToStoreKm: Number,
    expiresAt: { type: Date, required: true, index: true },
    respondedAt: Date,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

riderOfferSchema.index({ riderId: 1, status: 1, expiresAt: 1 });
riderOfferSchema.index({ subOrderObjectId: 1, status: 1 });
riderOfferSchema.index({ subOrderObjectId: 1, riderId: 1, status: 1, respondedAt: -1 });
riderOfferSchema.index(
  { subOrderObjectId: 1, riderId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "OPEN" } },
);

export const RiderOffer = mongoose.model<IRiderOffer>("RiderOffer", riderOfferSchema);
