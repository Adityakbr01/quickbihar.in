import { Types } from "mongoose";
import { SubOrder } from "./subOrder.model";

export interface IRequestInfo {
  ipAddress?: string;
  deviceInfo?: string;
  actorId?: string;
}

export class TimelineHelper {
  static createEvent(
    status: string,
    actor: "CUSTOMER" | "SELLER" | "RIDER" | "SYSTEM" | "ADMIN",
    actorId?: string | Types.ObjectId,
    requestInfo?: IRequestInfo,
    metadata?: Record<string, any>
  ) {
    return {
      status,
      actor,
      actorId: actorId ? new Types.ObjectId(actorId.toString()) : undefined,
      timestamp: new Date(),
      ipAddress: requestInfo?.ipAddress || "0.0.0.0",
      deviceInfo: requestInfo?.deviceInfo || "Unknown Device",
      metadata,
    };
  }

  static async addEvent(
    subOrderId: string,
    status: string,
    actor: "CUSTOMER" | "SELLER" | "RIDER" | "SYSTEM" | "ADMIN",
    actorId?: string | Types.ObjectId,
    requestInfo?: IRequestInfo,
    metadata?: Record<string, any>
  ) {
    const event = this.createEvent(status, actor, actorId, requestInfo, metadata);
    
    return await SubOrder.findByIdAndUpdate(
      subOrderId,
      {
        $push: { timeline: event },
      },
      { new: true }
    );
  }
}
