/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mailStore } from "@/lib/mailStore";
import { FolderInput } from "lucide-react";

export function MoveToDialog({
  open,
  onOpenChange,
  env,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  env: { uid: number; folder?: string };
}) {
  const folders = mailStore((s) => s.folders);
  const moveTo = mailStore((s) => s.moveTo);
  const activeFolder = mailStore((s) => s.activeFolder);

  const targets = folders.filter((f) => f.path !== (env.folder || activeFolder));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput size={16} /> Move to
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {targets.map((f) => (
            <Button
              key={f.path}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                moveTo(env.uid, env.folder || activeFolder, f.path, `Moved to ${f.name}`);
                onOpenChange(false);
              }}
            >
              {f.name === "INBOX" ? "Inbox" : f.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
