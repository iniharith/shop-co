"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function SyncButton() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setProgress(10);
    
    // Simulate initial progress to feel responsive
    const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 80));
    }, 200);

    try {
      await queryClient.invalidateQueries();
      clearInterval(interval);
      setProgress(100);
      toast.success("All data synced successfully!");
      
      // Delay before resetting to let the progress bar finish visually
      setTimeout(() => {
        setIsSyncing(false);
        setProgress(0);
      }, 500);
    } catch (e) {
      clearInterval(interval);
      toast.error("Failed to sync data");
      setIsSyncing(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSync}
        className="w-9 h-9"
        title="Sync All Data"
      >
        <RefreshCw className={`w-5 h-5 text-muted-foreground ${isSyncing ? "animate-spin text-primary" : ""}`} />
      </Button>
      {isSyncing && (
        <Progress 
          value={progress} 
          className="absolute -bottom-1 left-0 right-0 h-1 w-full rounded-none bg-muted/50" 
        />
      )}
    </div>
  );
}
