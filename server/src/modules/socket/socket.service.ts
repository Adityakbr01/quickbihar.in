import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.config";
import { User } from "../user/user.model";
import { SocketEvents } from "../../constants/socketEvents";

export class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

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
        const user = await User.findById(decoded._id);

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

      console.log(
        `[SocketService] User connected: ${user.fullName} (${userId})`,
      );

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      // Join rooms based on role
      if (user.role === "admin" || user.role === "superadmin") {
        // Assuming superadmin might exist
        socket.join("admins");
        console.log(`[SocketService] User ${userId} joined admins room`);
      }

      // Order Tracking Rooms
      socket.on(SocketEvents.JOIN_ORDER_ROOM, (orderId: string) => {
        socket.join(`order_${orderId}`);
        console.log(
          `[SocketService] User ${userId} joined room: order_${orderId}`,
        );
      });

      socket.on(SocketEvents.LEAVE_ORDER_ROOM, (orderId: string) => {
        socket.leave(`order_${orderId}`);
        console.log(
          `[SocketService] User ${userId} left room: order_${orderId}`,
        );
      });

      // Handle location updates from delivery partners
      socket.on(
        SocketEvents.UPDATE_DELIVERY_LOCATION,
        (data: {
          orderId: string;
          latitude: number;
          longitude: number;
          heading?: number;
        }) => {
          // Permission Check: Only delivery_partner or admin can update location
          const isDev = process.env.NODE_ENV !== "production";
          if (
            !isDev &&
            user.role !== "delivery_partner" &&
            user.role !== "admin" &&
            user.role !== "superadmin"
          ) {
            console.warn(
              `[SocketService] Unauthorized location update attempt by ${userId} (role: ${user.role})`,
            );
            return;
          }

          console.log(
            `[SocketService] Location update for order ${data.orderId} from ${userId}`,
          );

          // Broadcast to anyone in the order room
          this.io
            ?.to(`order_${data.orderId}`)
            .emit(SocketEvents.DELIVERY_LOCATION_UPDATED, {
              orderId: data.orderId,
              latitude: data.latitude,
              longitude: data.longitude,
              heading: data.heading || 0,
              timestamp: new Date().toISOString(),
            });
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
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((id) => {
        this.io?.to(id).emit(event, data);
      });
    }
  }

  emitToAdmins(event: string, data: any) {
    if (!this.io) return;
    this.io.to("admins").emit(event, data);
  }

  emitToAll(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

export const socketService = new SocketService();
