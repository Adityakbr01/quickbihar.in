import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ReturnRequestStatus =
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "RETURN_PICKUP_SCHEDULED"
  | "RETURN_PICKED_UP"
  | "RETURNED"
  | "REFUNDED"
  | "DISPUTED";

export interface IReturnRequest extends Document {
  returnId: string;
  parentOrderId: Types.ObjectId;
  subOrderObjectId: Types.ObjectId;
  subOrderId: string;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  riderId?: Types.ObjectId;
  status: ReturnRequestStatus;
  reason: string;
  notes?: string;
  pickupOtp?: string;
  proofPhoto?: string;
  timeline: Array<Record<string, any>>;
  createdAt: Date;
  updatedAt: Date;
}

const returnId = () => `ret_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    returnId: { type: String, required: true, unique: true, index: true, default: returnId },
    parentOrderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    subOrderObjectId: { type: Schema.Types.ObjectId, ref: "SubOrder", required: true, index: true },
    subOrderId: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    riderId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: [
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURN_REJECTED",
        "RETURN_PICKUP_SCHEDULED",
        "RETURN_PICKED_UP",
        "RETURNED",
        "REFUNDED",
        "DISPUTED",
      ],
      default: "RETURN_REQUESTED",
      index: true,
    },
    reason: { type: String, required: true, trim: true },
    notes: String,
    pickupOtp: String,
    proofPhoto: String,
    timeline: { type: [Schema.Types.Mixed] as any, default: [] },
  },
  { timestamps: true },
);

returnRequestSchema.index({ customerId: 1, createdAt: -1 });
returnRequestSchema.index({ sellerId: 1, status: 1 });

export const ReturnRequest = mongoose.model<IReturnRequest>(
  "ReturnRequest",
  returnRequestSchema,
);
