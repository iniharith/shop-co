/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "../../utils/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const client = useQueryClient();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
  }, []);

  const handleUserInteraction = () => {
    const audio = audioRef.current;
    if (audio && !isSoundEnabled) {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        setIsSoundEnabled(true);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleUserInteraction, { once: true });
    return () => window.removeEventListener("click", handleUserInteraction);
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!session?.user) return;
    const socket = getSocket(session);

    socket.on("connect", () => console.log("🟢 connected to socket"));

    socket.on("order_placed", async (data) => {
      audioRef.current?.play().catch(() => {});
      toast.info(data);
      await client.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on("new_message", async (data) => {
      await client.invalidateQueries({ queryKey: ["conversations"] });
      if (data?.conversationId) {
        await client.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      }
    });

    socket.on("notification", async (data) => {
      toast.info(data.message || data.title || "New Notification");
      await client.invalidateQueries({ queryKey: ["notifications"] });
    });

    // ── Real-time task sync ──────────────────────────────────────────────────
    // Fired by the backend on every task create / update / delete / file upload
    // / comment. Keeps every admin tab in sync without polling.
    socket.on("task_updated", async (data) => {
      // Surgically update the task in the list cache so the UI patches
      // immediately without a loading flash, then schedule a background refetch
      // to guarantee eventual consistency (in case we missed an event).
      if (data?.task) {
        client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
          if (!old?.tasks) return old;
          const exists = old.tasks.some((t: any) => t._id === data.task._id);
          return {
            ...old,
            tasks: exists
              ? old.tasks.map((t: any) => t._id === data.task._id ? { ...t, ...data.task } : t)
              : [...old.tasks, data.task],
          };
        });
        // Also update single-task cache (used by TaskModal)
        client.setQueryData(["task", data.task._id], (old: any) =>
          old ? { ...old, task: { ...old.task, ...data.task } } : old
        );
      }

      if (data?.event === 'task_deleted' && data?.taskId) {
        client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
          if (!old?.tasks) return old;
          return { ...old, tasks: old.tasks.filter((t: any) => t._id !== data.taskId) };
        });
      }

      // Background refetch — fires silently without triggering any loading state
      client.invalidateQueries({ queryKey: ["tasks"], refetchType: "none" });

      // New task creations (e.g. customer artwork uploads from /upload) also
      // bring new FileUpload docs with them — refresh the file-driven views
      // (Artworks/Production/Packaging managers) so they show up instantly
      // instead of requiring a manual page refresh.
      if (data?.event === 'task_created' || data?.event === 'task_updated') {
        client.invalidateQueries({ queryKey: ["allFiles"], refetchType: "active" });
        client.invalidateQueries({ queryKey: ["groupedFiles"], refetchType: "active" });
      }
    });

    socket.on("disconnect", () => console.log("🔴 disconnected from socket"));

    return () => {
      socket.off("task_updated");
    };
  }, [session?.user]);

  return <>{children}</>;
};

export default SocketProvider;
