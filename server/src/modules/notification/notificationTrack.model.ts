import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotificationTrack extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  status: "DELIVERED" | "OPENED";
  deliveredAt?: Date;
  openedAt?: Date;
}

const notificationTrackSchema = new Schema<INotificationTrack>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["DELIVERED", "OPENED"],
      required: true,
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user only has one tracking record per notification campaign
notificationTrackSchema.index({ notificationId: 1, userId: 1 }, { unique: true });

export const NotificationTrack = mongoose.model<INotificationTrack>("NotificationTrack", notificationTrackSchema);
