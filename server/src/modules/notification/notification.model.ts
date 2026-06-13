import mongoose, { Document, Schema, Types } from "mongoose";

export enum TargetType {
  ALL = "ALL",
  ROLE = "ROLE",
  SPECIFIC = "SPECIFIC",
}

export enum DeliveryChannel {
  IN_APP = "IN_APP",
  FCM = "FCM",
  BOTH = "BOTH",
}

export enum DeliveryType {
  ALERT = "ALERT",
  SILENT = "SILENT",
  LIVE_ACTIVITY = "LIVE_ACTIVITY",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
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

export enum NotificationType {
  NORMAL = "NORMAL",
  RICH = "RICH",
}

export enum Priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface INotification extends Document {
  title: string;
  description: string;
  body?: string;
  imageUrl?: string;
  richContent?: {
    image?: string;
  };
  channel: NotificationChannel;
  deliveryChannel: DeliveryChannel;
  deliveryType: DeliveryType;
  targetType: TargetType;
  targetRole?: string;
  targetUser?: Types.ObjectId;
  status: NotificationStatus;
  redirectType: RedirectType;
  redirectId?: string;
  externalUrl?: string;
  deepLink?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  notificationType: NotificationType;
  priority: Priority;
  actionButtonText?: string;
  sentCount: number;
  deliveryCount: number;
  openCount: number;
  failedCount: number;
  jobId?: string;
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
    body: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    richContent: {
      image: {
        type: String,
        trim: true,
      },
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.GENERAL,
      trim: true,
      index: true,
    },
    deliveryChannel: {
      type: String,
      enum: Object.values(DeliveryChannel),
      default: DeliveryChannel.BOTH,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: Object.values(DeliveryType),
      default: DeliveryType.ALERT,
      index: true,
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
    deepLink: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    notificationType: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.NORMAL,
      index: true,
    },
    actionButtonText: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM,
      index: true,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    deliveryCount: {
      type: Number,
      default: 0,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    jobId: {
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

// Pre-validate hook to automatically migrate legacy database records on save
notificationSchema.pre("validate", function (next) {
  const doc = this as any;
  if (["BOTH", "IN_APP", "FCM"].includes(doc.deliveryType)) {
    doc.deliveryChannel = doc.deliveryType;
    doc.deliveryType = "ALERT";
  }
  if (doc.status === "COMPLETED") {
    doc.status = "SENT";
  }
  if (typeof next === "function") {
    next();
  }
});

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);

