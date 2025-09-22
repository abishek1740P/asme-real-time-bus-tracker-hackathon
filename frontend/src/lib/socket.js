// lib/socket.js
import { io } from "socket.io-client";

let socket = null;

/**
 * Connect socket for drivers only, passing JWT token
 */
export const connectSocket = (token) => {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });
  }
};

/**
 * Disconnect the socket safely
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

/**
 * Get the active socket instance (for emitting, etc.)
 */
export const getSocket = () => {
  return socket;
};
