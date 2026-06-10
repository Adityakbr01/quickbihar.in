import mongoose, { Schema, type Document, type Types } from "mongoose";

export type FulfillmentActor = "CUSTOMER" | "SELLER" | "RIDER" | "SYSTEM" | "ADMIN";

export interface IFulfillmentEvent extends Document {
  eventId: string;
  sequence: number;
  type: string;
  orderId?: string;
  orderObjectId?: Types.ObjectId;
  subOrderId?: string;
  subOrderObjectId?: Types.ObjectId;
  status?: string;
  actor: FulfillmentActor;
  actorId?: Types.ObjectId;
  recipientIds: Types.ObjectId[];
  rooms: string[];
  metadata?: Record<string, any>;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventId = () => `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const fulfillmentEventSchema = new Schema<IFulfillmentEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: eventId,
    },
    sequence: { type: Number, required: true, index: true },
    type: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    orderObjectId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    subOrderId: { type: String, index: true },
    subOrderObjectId: { type: Schema.Types.ObjectId, ref: "SubOrder", index: true },
    status: { type: String, index: true },
    actor: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "RIDER", "SYSTEM", "ADMIN"],
      required: true,
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    rooms: [{ type: String, index: true }],
    metadata: { type: Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

fulfillmentEventSchema.index({ orderId: 1, sequence: 1 });
fulfillmentEventSchema.index({ subOrderId: 1, sequence: 1 });
fulfillmentEventSchema.index({ recipientIds: 1, occurredAt: -1 });
fulfillmentEventSchema.index({ rooms: 1, occurredAt: -1 });

export const FulfillmentEvent = mongoose.model<IFulfillmentEvent>(
  "FulfillmentEvent",
  fulfillmentEventSchema,
);
