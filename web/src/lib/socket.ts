"use client";

import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

let socket: Socket | null = null;
let activeToken: string | null = null;

const readToken = () => {
  if (typeof window === "undefined") return null;
  const persisted = window.localStorage.getItem("admin-auth-storage");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.token || null;
  } catch {
    window.localStorage.removeItem("admin-auth-storage");
    return null;
  }
};

export const getWebSocket = (tokenOverride?: string | null) => {
  const token = tokenOverride || readToken();
  if (!token) return null;

  if (socket && activeToken === token) return socket;

  socket?.disconnect();
  activeToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  return socket;
};

export const disconnectWebSocket = () => {
  socket?.disconnect();
  socket = null;
  activeToken = null;
};

export const webSocketClient = {
  connect: (token?: string) => getWebSocket(token),
  disconnect: disconnectWebSocket,
  on: (event: string, callback: (data: any) => void) => {
    getWebSocket()?.on(event, callback);
  },
  off: (event: string, callback?: (data: any) => void) => {
    const instance = getWebSocket();
    if (!instance) return;
    if (callback) instance.off(event, callback);
    else instance.off(event);
  },
  emit: (event: string, data?: any) => {
    getWebSocket()?.emit(event, data);
  },
  get isConnected() {
    return Boolean(socket?.connected);
  },
};
