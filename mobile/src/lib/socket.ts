import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

// In a real app, this would come from an environment variable
// For development, use your machine's local IP or localhost for simulator
const LOCAL_SOCKET_URL =
  Platform.OS === "android"
    ? "http://10.108.61.27:8000"
    : "http://10.108.61.27:8000";
const PROD_SOCKET_URL = "https://quickbihar-in.onrender.com";
const SOCKET_URL = __DEV__ ? LOCAL_SOCKET_URL : PROD_SOCKET_URL;

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
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

  off(event: string) {
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
