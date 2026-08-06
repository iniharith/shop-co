/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Inbox, Send, FileText, Trash2, Star, Archive, Ban, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MailAddress } from "@/lib/mail";

export function addr(a: MailAddress[]) {
  if (!a || !a.length) return "";
  return a.map((x) => x.name || x.address).join(", ");
}

export function addrShort(a: MailAddress[], ownEmail?: string) {
  if (!a || !a.length) return "Unknown";
  const x = a[0];
  if (ownEmail && x.address === ownEmail) return "me";
  return x.name || x.address.split("@")[0];
}

export function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const year = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    ...(year ? {} : { year: "2-digit" }),
  });
}

export function fmtFullDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const FOLDER_ICONS: Record<string, React.ElementType> = {
  INBOX: Inbox,
  "\\Inbox": Inbox,
  "\\Sent": Send,
  "\\Drafts": FileText,
  "\\Trash": Trash2,
  "\\Flagged": Star,
  Archive: Archive,
  "\\Junk": Ban,
  "\\Snoozed": Clock,
};

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className
      )}
    >
      {letter}
    </div>
  );
}

/* Heavier frosted glass, matching the backend admin surfaces */
export const GLASS =
  "bg-background/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl";
