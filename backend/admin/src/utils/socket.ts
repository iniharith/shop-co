/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { io, Socket } from "socket.io-client";
import { Session } from "next-auth";
let socket: Socket | null = null;

export const getSocket = (session: Session) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL+"/admin", {
      withCredentials: true,
      transports: ["websocket"], // Enforce WebSocket only to prevent long-polling connection exhaustion on Vercel
      query: {
        userId: session?.user?.id,
      },
    });
  }
  return socket;
};