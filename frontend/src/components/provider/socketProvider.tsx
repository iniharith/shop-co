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

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
  }, []);

  const handleUserInteraction = () => {
    const audio = audioRef.current;
    if (audio && !isSoundEnabled) {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          setIsSoundEnabled(true);
          console.log("🔓 Audio playback enabled");
        })
        .catch((err) => {
          console.warn("❌ Failed to unlock audio autoplay", err);
        });
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleUserInteraction);
    };
  }, [isSoundEnabled]);

  useEffect(() => {
    const socket = getSocket(session || undefined);

    socket.on("connect", () => {
      console.log("🟢 connected to socket");
    });

    socket.on("notification", async (data) => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch((err) => {
          console.error("🔊 Failed to play sound:", err);
        });
      }

      console.log("🟢 notification", data);
      toast.info(data.message, {
        description: data.description,
        action: {
          label: "View",
          onClick: () => {
            if (data?.orderId) {
              router.push(`/home/profile/orders/${data.orderId}`);
            } else {
              console.warn("No orderId provided in notification data");
            }
          },
        },
      });

      await client.invalidateQueries({ queryKey: ["notifications"] });
      await client.invalidateQueries({ queryKey: ["orders"] });
      await client.invalidateQueries({ queryKey: ["order"] });
      await client.invalidateQueries({ queryKey: ["products"] });
    });

    socket.on("disconnect", () => {
      console.log("🔴 disconnected from socket");
    });

    socket.on("product_updated", () => {
      void client.invalidateQueries({ queryKey: ["products"] });
      void client.invalidateQueries({ queryKey: ["product"] });
      void client.invalidateQueries({ queryKey: ["products-category"] });
      void client.invalidateQueries({ queryKey: ["products-filter"] });
      void client.invalidateQueries({ queryKey: ["product-search"] });
    });

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.off("disconnect");
      socket.off("product_updated");
    };
  }, [session?.user]);

  return <>{children}</>;
};

export default SocketProvider;
