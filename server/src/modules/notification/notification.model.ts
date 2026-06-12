import mongoose, { Document, Schema, Types } from "mongoose";

export enum TargetType {
  ALL = "ALL",
  ROLE = "ROLE",
  SPECIFIC = "SPECIFIC",
}

export enum DeliveryType {
  IN_APP = "IN_APP",
  FCM = "FCM",
  BOTH = "BOTH",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum NotificationChannel {
  GENERAL = "general",
  PROMOTIONS = "promotions",
  ORDERS = "orders",
  SYSTEM = "system",
}

export enum RedirectType {
  NONE = "none",
  PRODUCT = "product",
  CATEGORY = "category",
  EXTERNAL = "external",
}

export interface INotification extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  channel: NotificationChannel;
  deliveryType: DeliveryType;
  targetType: TargetType;
  targetRole?: string;
  targetUser?: Types.ObjectId;
  status: NotificationStatus;
  redirectType: RedirectType;
  redirectId?: string;
  externalUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.GENERAL,
      trim: true,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: Object.values(DeliveryType),
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(TargetType),
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      trim: true,
      index: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      index: true,
    },
    redirectType: {
      type: String,
      enum: Object.values(RedirectType),
      default: RedirectType.NONE,
      index: true,
    },
    redirectId: {
      type: String,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
