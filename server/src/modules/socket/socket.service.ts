import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.config";
import { User } from "../user/user.model";
import { SocketEvents } from "../../constants/socketEvents";
import { DeliveryBoy } from "../deliveryBoy/delivery.model";
import { Order } from "../order/order.model";
import { SubOrder } from "../order/subOrder.model";

export class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  private roleName(user: any) {
    return user?.roleId?.name || user?.role?.name || user?.role || "";
  }

  private isAdmin(user: any) {
    return ["ADMIN", "SUPER_ADMIN"].includes(this.roleName(user));
  }

  private async canJoinOrderRoom(user: any, orderId: string) {
    if (this.isAdmin(user)) return true;
    const userId = user._id.toString();
    const order = await Order.findOne({
      $or: [
        { orderId },
        ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : []),
      ],
    }).select("_id userId items.sellerId delivery.partnerUserId").lean();
    if (!order) return false;
    if (order.userId?.toString() === userId) return true;
    if ((order.items || []).some((item: any) => item.sellerId?.toString() === userId)) return true;
    if (order.delivery?.partnerUserId?.toString() === userId) return true;
    return false;
  }

  private async canJoinSubOrderRoom(user: any, subOrderId: string) {
    if (this.isAdmin(user)) return true;
    const userId = user._id.toString();
    const subOrder = await SubOrder.findOne({
      $or: [
        { subOrderId },
        ...(subOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: subOrderId }] : []),
      ],
    }).select("_id parentOrderId sellerId delivery.riderId").lean();
    if (!subOrder) return false;
    if (subOrder.sellerId?.toString() === userId) return true;
    if (subOrder.delivery?.riderId?.toString() === userId) return true;
    const parentOrder = await Order.findById(subOrder.parentOrderId).select("userId").lean();
    return parentOrder?.userId?.toString() === userId;
  }

  init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"],
      },
    });

    // Authentication Middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return next(new Error("Authentication error: Token missing"));
        }

        const decoded: any = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).populate("roleId");

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        (socket as any).user = user;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const user = (socket as any).user;
      const userId = user._id.toString();
      const roleName = this.roleName(user);

      console.log(
        `[SocketService] User connected: ${user.fullName} (${userId})`,
      );

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      // Join rooms
      socket.join(`user_${userId}`);
      socket.join(`user:${userId}`);
      console.log(`[SocketService] User ${userId} joined room: user_${userId}`);

      if (roleName) {
        socket.join(`role_${roleName.toLowerCase()}`);
        console.log(`[SocketService] User ${userId} joined role room: role_${roleName.toLowerCase()}`);
      }

      if (roleName === "ADMIN" || roleName === "SUPER_ADMIN") {
        socket.join("admins");
        socket.join("admin");
        console.log(`[SocketService] User ${userId} joined admins room`);
      }

      if (roleName === "SELLER") {
        socket.join(`seller_${userId}`);
        socket.join(`seller:${userId}`);
        console.log(`[SocketService] Seller ${userId} joined room: seller_${userId}`);
      }

      if (roleName === "DELIVERY" || roleName === "RIDER") {
        socket.join(`rider_${userId}`);
        socket.join(`rider:${userId}`);
        console.log(`[SocketService] Rider ${userId} joined room: rider_${userId}`);
        
        // Join matching room if active and online
        DeliveryBoy.findOne({ userId: user._id }).then(profile => {
          if (profile && profile.status === "APPROVED" && profile.isOnline) {
            socket.join("riders_matching");
            console.log(`[SocketService] Active Rider ${userId} joined room: riders_matching`);
          }
        }).catch(err => {
          console.error("[SocketService] Error checking rider online status:", err);
        });
      }

      // Order Tracking Rooms (Parent Orders)
      socket.on(SocketEvents.JOIN_ORDER_ROOM, async (orderId: string) => {
        if (!(await this.canJoinOrderRoom(user, orderId))) {
          socket.emit("socket_error", { event: SocketEvents.JOIN_ORDER_ROOM, message: "Order room access denied" });
          return;
        }
        socket.join(`order_${orderId}`);
        socket.join(`order:${orderId}`);
        console.log(`[SocketService] User ${userId} joined room: order_${orderId}`);
      });

      socket.on(SocketEvents.LEAVE_ORDER_ROOM, (orderId: string) => {
        socket.leave(`order_${orderId}`);
        socket.leave(`order:${orderId}`);
        console.log(
          `[SocketService] User ${userId} left room: order_${orderId}`,
        );
      });

      // Sub-Order Tracking Rooms
      socket.on("join_suborder_room", async (subOrderId: string) => {
        if (!(await this.canJoinSubOrderRoom(user, subOrderId))) {
          socket.emit("socket_error", { event: "join_suborder_room", message: "Sub-order room access denied" });
          return;
        }
        socket.join(`suborder_${subOrderId}`);
        socket.join(`suborder:${subOrderId}`);
        console.log(`[SocketService] User ${userId} joined room: suborder_${subOrderId}`);
      });

      socket.on("leave_suborder_room", (subOrderId: string) => {
        socket.leave(`suborder_${subOrderId}`);
        socket.leave(`suborder:${subOrderId}`);
        console.log(
          `[SocketService] User ${userId} left room: suborder_${subOrderId}`,
        );
      });

      // Handle location updates from delivery partners
      socket.on(
        SocketEvents.UPDATE_DELIVERY_LOCATION,
        async (data: {
          orderId: string; // can be parent orderId or subOrderId
          latitude: number;
          longitude: number;
          heading?: number;
        }) => {
          const isSubOrder = data.orderId.includes("-");
          let subOrder = null;
          let parentOrderId = data.orderId;
          let subOrderId = data.orderId;

          if (isSubOrder) {
            subOrder = await SubOrder.findOne({ subOrderId: data.orderId });
            if (subOrder) {
              parentOrderId = subOrder.parentOrderId.toString();
            }
          }

          console.log(
            `[SocketService] Location update for ${isSubOrder ? "sub-order" : "order"} ${data.orderId} from rider ${userId}`
          );

          const location = {
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading || 0,
            updatedAt: new Date(),
          };

          // Update rider's profile location in DB
          await DeliveryBoy.updateOne(
            { userId },
            { $set: { currentLocation: { type: "Point", coordinates: [data.longitude, data.latitude] } } },
          );

          if (isSubOrder && subOrder) {
            await SubOrder.updateOne({ _id: subOrder._id }, { $set: { "delivery.currentLocation": location } });
            
            // Emit to sub-order specific room
            this.emitToSubOrderRoom(subOrderId, "delivery_location_updated", {
              subOrderId,
              latitude: data.latitude,
              longitude: data.longitude,
              heading: data.heading || 0,
              timestamp: new Date().toISOString(),
            });
          }

          // Also update parent order for backward compatibility
          const parentOrder = await Order.findOne({
            $or: [{ orderId: parentOrderId }, ...(parentOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: parentOrderId }] : [])],
          });

          if (parentOrder) {
            await Order.updateOne({ _id: parentOrder._id }, { $set: { "delivery.currentLocation": location } });
            this.emitToOrderRoom(parentOrder.orderId, SocketEvents.DELIVERY_LOCATION_UPDATED, {
              orderId: parentOrder.orderId,
              latitude: data.latitude,
              longitude: data.longitude,
              heading: data.heading || 0,
              timestamp: new Date().toISOString(),
            });
          }
        },
      );

      socket.on("disconnect", () => {
        console.log(`[SocketService] User disconnected: ${userId}`);
        const sockets = this.userSockets.get(userId) || [];
        this.userSockets.set(
          userId,
          sockets.filter((id) => id !== socket.id),
        );
        if (this.userSockets.get(userId)?.length === 0) {
          this.userSockets.delete(userId);
        }
      });
    });

    return this.io;
  }

  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
    this.io.to(`user_${userId}`).emit(event, data);
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((id) => {
        this.io?.to(id).emit(event, data);
      });
    }
  }

  emitToAdmins(event: string, data: any) {
    if (!this.io) return;
    this.io.to("admin").emit(event, data);
    this.io.to("admins").emit(event, data);
  }

  emitToOrderRoom(orderId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`order:${orderId}`).emit(event, data);
    this.io.to(`order_${orderId}`).emit(event, data);
  }

  emitToSubOrderRoom(subOrderId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`suborder:${subOrderId}`).emit(event, data);
    this.io.to(`suborder_${subOrderId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
    if (room.includes(":")) {
      this.io.to(room.replace(":", "_")).emit(event, data);
    }
  }

  emitToAll(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

export const socketService = new SocketService();
