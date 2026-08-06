/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mailStore } from "@/lib/mailStore";
import { Clock } from "lucide-react";

export const SNOOZE_PRESETS: { label: string; ms: number }[] = [
  { label: "Later today", ms: 2 * 3600 * 1000 },
  { label: "Tomorrow morning", ms: 12 * 3600 * 1000 },
  { label: "This weekend", ms: 3 * 24 * 3600 * 1000 },
  { label: "Next week", ms: 7 * 24 * 3600 * 1000 },
];

export function SnoozeDialog({
  open,
  onOpenChange,
  env,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  env: { uid: number; folder?: string };
}) {
  const snooze = mailStore((s) => s.snooze);
  const activeFolder = mailStore((s) => s.activeFolder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={16} /> Snooze
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SNOOZE_PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                snooze(env.uid, env.folder || activeFolder, new Date(Date.now() + p.ms).toISOString());
                onOpenChange(false);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
