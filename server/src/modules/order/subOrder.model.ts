import mongoose, { Schema, Document, Types } from "mongoose";
import { DeliveryStatus, OrderStatus } from "./order.type";

export enum SubOrderStatus {
  PAYMENT_VERIFIED = "PAYMENT_VERIFIED",
  CONFIRMED = "CONFIRMED",
  SELLER_ACCEPTED = "SELLER_ACCEPTED",
  SELLER_REJECTED = "SELLER_REJECTED",
  PROCESSING = "PROCESSING",
  PACKED = "PACKED",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  RIDER_ASSIGNMENT_OPEN = "RIDER_ASSIGNMENT_OPEN",
  RIDER_ASSIGNED = "RIDER_ASSIGNED",
  RIDER_ACCEPTED = "RIDER_ACCEPTED",
  RIDER_REJECTED = "RIDER_REJECTED",
  RIDER_ARRIVING = "RIDER_ARRIVING",
  RIDER_REACHED_STORE = "RIDER_REACHED_STORE",
  PICKUP_VERIFICATION_PENDING = "PICKUP_VERIFICATION_PENDING",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  NEAR_CUSTOMER = "NEAR_CUSTOMER",
  DELIVERED = "DELIVERED",
  DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  SELLER_CANCELLED = "SELLER_CANCELLED",
  CUSTOMER_CANCELLED = "CUSTOMER_CANCELLED",
  RIDER_CANCELLED = "RIDER_CANCELLED",
  RIDER_NO_SHOW = "RIDER_NO_SHOW",
  STORE_CLOSED = "STORE_CLOSED",
  PICKUP_FAILED = "PICKUP_FAILED",
  DELIVERY_FAILED = "DELIVERY_FAILED",
  CUSTOMER_UNREACHABLE = "CUSTOMER_UNREACHABLE",
  RETURN_INITIATED = "RETURN_INITIATED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURN_APPROVED = "RETURN_APPROVED",
  RETURN_PICKUP_SCHEDULED = "RETURN_PICKUP_SCHEDULED",
  RETURN_PICKED_UP = "RETURN_PICKED_UP",
  RETURNED = "RETURNED",
  REFUNDED = "REFUNDED",
  DISPUTED = "DISPUTED",
  PARTIAL_DELIVERY = "PARTIAL_DELIVERY",
  PARTIAL_REFUND = "PARTIAL_REFUND",
}

export interface ISubOrderOrderItem {
  productId: Types.ObjectId;
  title: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  sellerSubtotal: number;
}

export interface ITimelineEvent {
  status: string;
  actor: "CUSTOMER" | "SELLER" | "RIDER" | "SYSTEM" | "ADMIN";
  actorId?: Types.ObjectId;
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
}

export interface ISubOrder extends Document {
  subOrderId: string;
  parentOrderId: Types.ObjectId;
  sellerId: Types.ObjectId;
  storeId: Types.ObjectId;
  items: ISubOrderOrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  dynamicDeliverySurcharge?: number;
  platformCommission?: number;
  sellerNet?: number;
  appNetAfterRider?: number;
  pricingSnapshot?: Record<string, any>;
  payableAmount: number;
  status: SubOrderStatus;
  packageDetails?: {
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    weight: number;
    packageCount: number;
    isFragile: boolean;
    isCod: boolean;
    otpRequired: boolean;
    pickupNotes?: string;
    pickupTiming?: Date;
    lockedAt?: Date;
  };
  delivery: {
    riderId?: Types.ObjectId;
    riderProfileId?: Types.ObjectId;
    status: DeliveryStatus;
    pickupOtp?: string;
    deliveryOtp?: string;
    payoutAmount: number;
    distanceKm?: number;
    bonuses?: {
      rain: number;
      peak: number;
      festival: number;
      night: number;
    };
    pickupPhoto?: string;
    deliveryPhoto?: string;
    deliverySignature?: string;
    assignedAt?: Date;
    currentLocation?: {
      latitude: number;
      longitude: number;
      heading?: number;
      updatedAt?: Date;
    };
    events?: any[];
  };
  timeline: ITimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const subOrderOrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    sellerSubtotal: { type: Number, required: true },
  },
  { _id: false }
);

const timelineEventSchema = new Schema(
  {
    status: { type: String, required: true },
    actor: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "RIDER", "SYSTEM", "ADMIN"],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    deviceInfo: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const subOrderSchema = new Schema<ISubOrder>(
  {
    subOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    items: {
      type: [subOrderOrderItemSchema],
      required: true,
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    dynamicDeliverySurcharge: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    sellerNet: { type: Number, default: 0 },
    appNetAfterRider: { type: Number, default: 0 },
    pricingSnapshot: { type: Schema.Types.Mixed },
    payableAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(SubOrderStatus),
      default: SubOrderStatus.CONFIRMED,
      index: true,
    },
    packageDetails: {
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      weight: { type: Number, default: 0 },
      packageCount: { type: Number, default: 1 },
      isFragile: { type: Boolean, default: false },
      isCod: { type: Boolean, default: false },
      otpRequired: { type: Boolean, default: true },
      pickupNotes: String,
      pickupTiming: Date,
      lockedAt: Date,
    },
    delivery: {
      riderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      riderProfileId: {
        type: Schema.Types.ObjectId,
        ref: "DeliveryBoy",
        index: true,
      },
      status: {
        type: String,
        enum: Object.values(DeliveryStatus),
        default: DeliveryStatus.UNASSIGNED,
        index: true,
      },
      pickupOtp: String,
      deliveryOtp: String,
      payoutAmount: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 },
      bonuses: {
        rain: { type: Number, default: 0 },
        peak: { type: Number, default: 0 },
        festival: { type: Number, default: 0 },
        night: { type: Number, default: 0 },
      },
      pickupPhoto: String,
      deliveryPhoto: String,
      deliverySignature: String,
      assignedAt: Date,
      currentLocation: {
        latitude: Number,
        longitude: Number,
        heading: { type: Number, default: 0 },
        updatedAt: Date,
      },
      events: {
        type: [Schema.Types.Mixed],
        default: [],
      },
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

subOrderSchema.index({ sellerId: 1, status: 1 });
subOrderSchema.index({ "delivery.riderId": 1, "delivery.status": 1 });

export const SubOrder = mongoose.model<ISubOrder>("SubOrder", subOrderSchema);
