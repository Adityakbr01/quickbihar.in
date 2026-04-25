import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { LOCAL_URL } from "../api/axiosInstance";

const BASE_URL =
  Platform.OS === "android"
    ? LOCAL_URL
    : LOCAL_URL;

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: async () => {
    try {
      if (get().isConnected) return;

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      const socketInstance = io(BASE_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketInstance.on("connect", () => {
        set({ isConnected: true });
        console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        set({ isConnected: false });
      });

      set({ socket: socketInstance });
    } catch (error) {
      console.error(error);
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
