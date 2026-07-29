import mongoose, { Schema, type Document, type Types } from "mongoose";

export type NotificationChannel = "SOCKET" | "PUSH" | "EMAIL" | "SMS";
export type NotificationOutboxStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface INotificationOutbox extends Document {
  idempotencyKey: string;
  eventId?: string;
  channel: NotificationChannel;
  status: NotificationOutboxStatus;
  recipientId?: Types.ObjectId;
  room?: string;
  title?: string;
  body?: string;
  payload?: Record<string, any>;
  attempts: number;
  nextAttemptAt?: Date;
  sentAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationOutboxSchema = new Schema<INotificationOutbox>(
  {
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, index: true },
    channel: {
      type: String,
      enum: ["SOCKET", "PUSH", "EMAIL", "SMS"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "SKIPPED"],
      default: "PENDING",
      index: true,
    },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    room: { type: String, index: true },
    title: String,
    body: String,
    payload: { type: Schema.Types.Mixed },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: Date,
    sentAt: Date,
    lastError: String,
  },
  { timestamps: true },
);

notificationOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
notificationOutboxSchema.index({ recipientId: 1, createdAt: -1 });

export const NotificationOutbox = mongoose.model<INotificationOutbox>(
  "NotificationOutbox",
  notificationOutboxSchema,
);
