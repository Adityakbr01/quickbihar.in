import mongoose, { Schema, type Document, type Types } from "mongoose";

export type CodSettlementStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface ICodSettlement extends Document {
  riderId: Types.ObjectId;
  riderProfileId: Types.ObjectId;
  amount: number;
  previousLiability: number;
  newLiability: number;
  status: CodSettlementStatus;
  referenceId?: string;
  note?: string;
  depositedAt: Date;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const codSettlementSchema = new Schema<ICodSettlement>(
  {
    riderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    riderProfileId: { type: Schema.Types.ObjectId, ref: "DeliveryBoy", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    previousLiability: { type: Number, required: true, min: 0 },
    newLiability: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "VERIFIED",
      index: true,
    },
    referenceId: String,
    note: String,
    depositedAt: { type: Date, default: Date.now },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

codSettlementSchema.index({ riderId: 1, createdAt: -1 });

export const CodSettlement = mongoose.model<ICodSettlement>(
  "CodSettlement",
  codSettlementSchema,
);
