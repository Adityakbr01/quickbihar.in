import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.config";
import { User } from "../user/user.model";

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
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
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

      console.log(`[SocketService] User connected: ${user.fullName} (${userId})`);

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      // Join rooms based on role
      if (user.role === "admin") {
        socket.join("admins");
        console.log(`[SocketService] User ${userId} joined admins room`);
      }

      socket.on("disconnect", () => {
        console.log(`[SocketService] User disconnected: ${userId}`);
        const sockets = this.userSockets.get(userId) || [];
        this.userSockets.set(userId, sockets.filter(id => id !== socket.id));
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
      socketIds.forEach(id => {
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
