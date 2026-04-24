import mongoose, { Schema, Types, Document } from "mongoose";

export enum ApplicationType {
  SELLER = "SELLER",
  RIDER = "RIDER",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IApplication extends Document {
  userId: Types.ObjectId;
  type: ApplicationType;
  status: ApplicationStatus;
  documents: Array<{
    name: string;
    url: string;
    fileId: string;
  }>;
  details: Record<string, any>;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ApplicationType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
      index: true,
    },
    documents: [
      {
        name: String,
        url: String,
        fileId: String,
      },
    ],
    details: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    rejectionReason: String,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Application = mongoose.model<IApplication>("Application", applicationSchema);
