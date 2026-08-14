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
import { useTaskTypingStore } from "@/store/taskTypingStore";
import { useChatTypingStore } from "@/store/chatTypingStore";
import { isLowPowerDevice } from "@/hooks/useLowPowerAnimations";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const token = (session?.user as any)?.token as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const client = useQueryClient();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasConnectedRef = useRef(false);

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
    if (!session?.user || !token) return;
    const socket = getSocket(session);
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    const refreshActiveTaskData = () => {
      if (document.visibilityState !== "visible") return;
      void client.invalidateQueries({ queryKey: ["tasks"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["task"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["orders"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["folderGroup"], refetchType: "active" });
    };

    const refreshActiveFileData = () => {
      if (document.visibilityState !== "visible") return;
      ["allFiles", "groupedFiles", "fileIndex", "folderGroup", "filesByFolder"].forEach((key) => {
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
      const interval = isLowPowerDevice() ? 120_000 : 60_000;
      fallbackInterval = setInterval(() => {
        refreshActiveTaskData();
        refreshActiveFileData();
      }, interval);
    };

    const handleConnect = () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      stopFallbackPolling();
      if (hasConnectedRef.current) {
        refreshActiveTaskData();
        refreshActiveFileData();
      }
      hasConnectedRef.current = true;
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

    const handleChatTyping = (data: any) => {
      if (!data?.conversationId) return;
      if (String(data.userId) === String(userId)) return;
      useChatTypingStore.getState().setTyping(data.conversationId, {
        userId: data.userId,
        userName: data.userName || 'Someone',
        typing: !!data.typing,
        at: Date.now(),
      });
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
      void client.invalidateQueries({ queryKey: ["task"], refetchType: "active" });
      void client.invalidateQueries({ queryKey: ["orders"], refetchType: "active" });
    };

    const handleTaskTyping = (data: any) => {
      if (!data?.taskId || !data?.field) return;
      if (data?.stopped) {
        useTaskTypingStore.getState().clearTyping(data.taskId);
        return;
      }
      if (!data?.text || String(data.userId) === String(userId)) return;
      useTaskTypingStore.getState().setTyping(data.taskId, {
        userId: data.userId,
        userName: data.userName || 'Someone',
        text: data.text,
        at: Date.now(),
      });
    };

    const handleFilesUpdated = () => refreshActiveFileData();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshActiveTaskData();
      refreshActiveFileData();
      if (!socket.connected && !isLowPowerDevice()) startFallbackPolling();
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("realtime_status", handleRealtimeStatus);
    socket.on("order_placed", handleOrderPlaced);
    socket.on("new_message", handleNewMessage);
    socket.on("chat_typing", handleChatTyping);
    socket.on("notification", handleNotification);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_typing", handleTaskTyping);
    socket.on("files_updated", handleFilesUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (socket.connected) handleConnect();
    else fallbackTimeout = setTimeout(startFallbackPolling, 5_000);

    return () => {
      stopFallbackPolling();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("realtime_status", handleRealtimeStatus);
      socket.off("order_placed", handleOrderPlaced);
      socket.off("new_message", handleNewMessage);
      socket.off("chat_typing", handleChatTyping);
      socket.off("notification", handleNotification);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_typing", handleTaskTyping);
      socket.off("files_updated", handleFilesUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnectSocket();
    };
  }, [client, token, userId]);

  return <>{children}</>;
};

export default SocketProvider;
