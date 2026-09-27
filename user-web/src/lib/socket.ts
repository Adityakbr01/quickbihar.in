import { io, Socket } from "socket.io-client";
import { API_ORIGIN } from "../api/axiosInstance";

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_ORIGIN, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected to server");
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketClient] Connection error:", err.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketClient] Disconnected:", reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off(event, callback);
      return;
    }
    this.socket?.off(event);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
