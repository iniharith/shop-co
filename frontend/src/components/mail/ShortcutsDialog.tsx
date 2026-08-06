/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mailStore } from "@/lib/mailStore";

const SHORTCUTS: [string, string][] = [
  ["c", "Compose new message"],
  ["r", "Reply"],
  ["a", "Reply all"],
  ["f", "Forward"],
  ["/", "Focus search"],
  ["j / k", "Next / previous message"],
  ["Enter", "Open selected message"],
  ["u", "Back to list"],
  ["s", "Star / unstar"],
  ["e", "Archive"],
  ["#", "Delete"],
  ["m", "Mark as unread"],
  ["? / h", "Show shortcuts"],
  ["Esc", "Close / deselect"],
];

export function ShortcutsDialog() {
  const open = mailStore((s) => s.shortcutsOpen);
  const setOpen = mailStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          {SHORTCUTS.map(([keys, desc]) => (
            <div key={keys} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">{keys}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
