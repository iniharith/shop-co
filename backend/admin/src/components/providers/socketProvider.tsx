/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useRef } from "react";
import { disconnectSocket, getSocket } from "../../utils/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { removeTaskFromCaches, updateTaskCaches } from "@/utils/taskCache";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const client = useQueryClient();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    const handleUserInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    };
    window.addEventListener("click", handleUserInteraction, { once: true });
    return () => window.removeEventListener("click", handleUserInteraction);
  }, []);

  useEffect(() => {
    const token = (session?.user as any)?.token;
    if (!session?.user || !token) return;
    const socket = getSocket(session);
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const refreshActiveTaskData = () => {
      if (document.visibilityState !== "visible") return;
      void client.invalidateQueries({ queryKey: ["tasks"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["task"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["orders"], refetchType: "active" });
    };

    const refreshActiveFileData = () => {
      if (document.visibilityState !== "visible") return;
      ["allFiles", "groupedFiles", "fileIndex", "filesByFolder"].forEach((key) => {
        void client.invalidateQueries({ queryKey: [key], refetchType: "active" });
      });
    };

    const stopFallbackPolling = () => {
      if (!fallbackInterval) return;
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    };

    const startFallbackPolling = () => {
      if (fallbackInterval) return;
      refreshActiveTaskData();
      refreshActiveFileData();
      fallbackInterval = setInterval(() => {
        refreshActiveTaskData();
        refreshActiveFileData();
      }, 2000);
    };

    const handleConnect = () => {
      refreshActiveTaskData();
      refreshActiveFileData();
    };

    const handleDisconnect = () => startFallbackPolling();
    const handleConnectError = () => startFallbackPolling();
    const handleRealtimeStatus = (data: any) => {
      if (data?.ready) stopFallbackPolling();
      else startFallbackPolling();
    };

    const handleOrderPlaced = async (data: any) => {
      audioRef.current?.play().catch(() => {});
      toast.info(data);
      await client.invalidateQueries({ queryKey: ["orders"] });
    };

    const handleNewMessage = async (data: any) => {
      await client.invalidateQueries({ queryKey: ["conversations"] });
      if (data?.conversationId) {
        await client.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      }
    };

    const handleNotification = async (data: any) => {
      toast.info(data.message || data.title || "New Notification");
      await client.invalidateQueries({ queryKey: ["notifications"] });
    };

    const handleTaskUpdated = (data: any) => {
      if (data?.task) {
        updateTaskCaches(client, data.task);
      }

      if (data?.event === 'task_deleted' && data?.taskId) {
        removeTaskFromCaches(client, data.taskId);
      }

      // Refetch active filtered lists so tasks move into or out of status views.
      void client.invalidateQueries({ queryKey: ["tasks"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["orders"], refetchType: "active" });
    };

    const handleFilesUpdated = () => refreshActiveFileData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !socket.connected) refreshActiveTaskData();
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("realtime_status", handleRealtimeStatus);
    socket.on("order_placed", handleOrderPlaced);
    socket.on("new_message", handleNewMessage);
    socket.on("notification", handleNotification);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("files_updated", handleFilesUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (socket.connected) handleConnect();
    else startFallbackPolling();

    return () => {
      stopFallbackPolling();
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("realtime_status", handleRealtimeStatus);
      socket.off("order_placed", handleOrderPlaced);
      socket.off("new_message", handleNewMessage);
      socket.off("notification", handleNotification);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("files_updated", handleFilesUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnectSocket();
    };
  }, [client, session]);

  return <>{children}</>;
};

export default SocketProvider;
