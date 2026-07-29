import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDeviceToken extends Document {
  fcmToken: string;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    fcmToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DeviceToken = mongoose.model<IDeviceToken>("DeviceToken", deviceTokenSchema);
