"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import axios from "axios";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  unreadCount: 0,
  setUnreadCount: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only connect if the user is authenticated
    if (status === "authenticated" && session?.user) {
      // Fetch initial unread count
      axios
        .get("/api/messages/unread")
        .then((res) => {
          if (res.data?.unreadCount !== undefined) {
            setUnreadCount(res.data.unreadCount);
          }
        })
        .catch((err) => console.error("Failed to fetch unread count", err));

      const socketInstance = io({
        path: "/socket.io",
        transports: ["websocket"], // Force websocket to avoid polling 404s
        addTrailingSlash: false,
        reconnectionAttempts: 5,
      });

      socketInstance.on("connect", () => {
        const userId = session?.user?.id;
        if (userId) {
          socketInstance.emit("join-room", userId);
        }
      });

      // Listen for online users updates from server
      socketInstance.on("get-online-users", (users: string[]) => {
        setOnlineUsers(users);
      });

      // Listen for new messages
      socketInstance.on("new-message", (message: any) => {
        // Optionally check if the message is from current conversation if needed
        // For now, just increment global unread count
        setUnreadCount((prev) => prev + 1);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.off("get-online-users");
        socketInstance.off("new-message");
        socketInstance.disconnect();
        setSocket(null);
      };
    } else if (status === "unauthenticated" && socket) {
      // Cleanup if user logs out
      socket.disconnect();
      setSocket(null);
      setUnreadCount(0);
    }
  }, [session, status]);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, unreadCount, setUnreadCount }}
    >
      {children}
    </SocketContext.Provider>
  );
};
