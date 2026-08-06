/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Reply,
  RefreshCw,
  Trash2,
  Archive,
  Ban,
  Star,
  MailOpen,
  Clock,
  FolderInput,
  Printer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { mailStore } from "@/lib/mailStore";
import { cn } from "@/lib/utils";
import { addr, addrShort, fmtDate, fmtFullDate, FOLDER_ICONS, Avatar, GLASS } from "./mail-utils";
import { SnoozeDialog } from "./SnoozeDialog";
import { MoveToDialog } from "./MoveToDialog";
import type { MailEnvelope, MailMessage } from "@/lib/mail";

export function MailboxView() {
  const folders = mailStore((s) => s.folders);
  const activeFolder = mailStore((s) => s.activeFolder);
  const list = mailStore((s) => s.list);
  const total = mailStore((s) => s.total);
  const page = mailStore((s) => s.page);
  const pageSize = mailStore((s) => s.pageSize);
  const selected = mailStore((s) => s.selected);
  const message = mailStore((s) => s.message);
  const loadingList = mailStore((s) => s.loadingList);
  const loadingMsg = mailStore((s) => s.loadingMsg);
  const preview = mailStore((s) => s.preview);
  const email = mailStore((s) => s.email);

  const openMessage = mailStore((s) => s.openMessage);
  const setActiveFolder = mailStore((s) => s.setActiveFolder);
  const setPage = mailStore((s) => s.setPage);
  const closeMessage = mailStore((s) => s.closeMessage);
  const refresh = mailStore((s) => s.refresh);
  const openCompose = mailStore((s) => s.openCompose);
  const toggleFlag = mailStore((s) => s.toggleFlag);
  const setSeen = mailStore((s) => s.setSeen);
  const trash = mailStore((s) => s.trash);
  const archive = mailStore((s) => s.archive);
  const spam = mailStore((s) => s.spam);
  const ctx = mailStore((s) => s.ctx);
  const setCtx = mailStore((s) => s.setCtx);

  const [snoozeFor, setSnoozeFor] = useState<MailEnvelope | null>(null);
  const [moveFor, setMoveFor] = useState<MailEnvelope | null>(null);

  const folderLabel = folders.find((f) => f.path === activeFolder)?.name || activeFolder;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex min-w-0 flex-1">
        {/* Message list */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-border md:w-96 md:shrink-0",
            selected ? "hidden md:flex" : "flex"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {(() => {
                const Icon = FOLDER_ICONS[activeFolder] || Search;
                return <Icon size={16} />;
              })()}
              <span className="capitalize">
                {folderLabel === "INBOX" ? "Inbox" : folderLabel}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {total} message{total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="border-b border-border p-2 md:hidden">
            <select
              value={activeFolder}
              onChange={(e) => setActiveFolder(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none"
            >
              {folders.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.name === "INBOX" ? "Inbox" : f.name} ({f.total})
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="animate-spin" size={18} /> Loading…
              </div>
            ) : list.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No messages
              </div>
            ) : (
              list.map((m) => (
                <button
                  key={m.uid}
                  onClick={() => openMessage(m)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCtx({ x: e.clientX, y: e.clientY, env: m });
                  }}
                  className={cn(
                    "flex w-full gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-accent/60",
                    selected?.uid === m.uid && "bg-accent",
                    !m.seen && "bg-primary/[0.04]"
                  )}
                >
                  <div className="relative mt-0.5 size-2 shrink-0">
                    {!m.seen && <span className="absolute size-2 rounded-full bg-primary" />}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFlag(m.uid, m.folder || activeFolder, m);
                    }}
                    title="Star"
                    className="shrink-0 self-center"
                  >
                    <Star
                      size={15}
                      className={cn(
                        "transition-colors",
                        m.flags.includes("\\Flagged")
                          ? "fill-primary text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          !m.seen ? "font-semibold" : "font-normal"
                        )}
                      >
                        {addrShort(m.from, email) || m.subject}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {fmtDate(m.date)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "truncate text-sm",
                        m.seen ? "text-muted-foreground" : "font-medium"
                      )}
                    >
                      {m.subject}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>

        {/* Reading pane */}
        {loadingMsg ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className={cn("flex-1", selected ? "flex" : "hidden md:flex")}>
            <MessageView
              message={message}
              folder={activeFolder}
              onBack={closeMessage}
              onRefresh={() => refresh()}
              onReply={(m) => openCompose("reply", m)}
              onReplyAll={(m) => openCompose("reply-all", m)}
              onForward={(m) => openCompose("forward", m)}
              onTrash={(m) => trash(m.uid, activeFolder)}
              onArchive={(m) => archive(m.uid, activeFolder)}
              onSpam={(m) => spam(m.uid, activeFolder)}
              onStar={(uid, f, env) => toggleFlag(uid, f, env)}
              onUnread={(uid, f, seen) => setSeen(uid, f, seen)}
              onSnooze={(m) => setSnoozeFor({ uid: m.uid, seq: 0, flags: m.flags, seen: m.seen, date: m.date, subject: m.subject, from: m.from, to: m.to, folder: activeFolder })}
              onMove={(m) => setMoveFor({ uid: m.uid, seq: 0, flags: m.flags, seen: m.seen, date: m.date, subject: m.subject, from: m.from, to: m.to, folder: activeFolder })}
            />
          </div>
        )}
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          env={ctx.env}
          onClose={() => setCtx(null)}
          onDelete={() => trash(ctx.env.uid, ctx.env.folder || activeFolder)}
          onArchive={() => archive(ctx.env.uid, ctx.env.folder || activeFolder)}
          onSpam={() => spam(ctx.env.uid, ctx.env.folder || activeFolder)}
          onSnooze={() => setSnoozeFor(ctx.env)}
          onMove={() => setMoveFor(ctx.env)}
        />
      )}

      {snoozeFor && (
        <SnoozeDialog
          open
          onOpenChange={(v) => !v && setSnoozeFor(null)}
          env={snoozeFor}
        />
      )}
      {moveFor && (
        <MoveToDialog
          open
          onOpenChange={(v) => !v && setMoveFor(null)}
          env={moveFor}
        />
      )}
    </>
  );
}

const Search = FOLDER_ICONS["INBOX"];

function ContextMenu({
  x,
  y,
  env,
  onClose,
  onDelete,
  onArchive,
  onSpam,
  onSnooze,
  onMove,
}: {
  x: number;
  y: number;
  env: MailEnvelope;
  onClose: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onSpam: () => void;
  onSnooze: () => void;
  onMove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onScroll = () => onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - 220);

  const items = [
    { icon: <Trash2 size={15} className="text-destructive" />, label: "Delete", fn: onDelete },
    { icon: <Archive size={15} />, label: "Archive", fn: onArchive },
    { icon: <Ban size={15} />, label: "Mark as spam", fn: onSpam },
    { icon: <Clock size={15} />, label: "Snooze", fn: onSnooze },
    { icon: <FolderInput size={15} />, label: "Move to folder", fn: onMove },
  ];

  return (
    <div
      ref={ref}
      className={cn("fixed z-50 w-52 overflow-hidden border p-1.5", GLASS)}
      style={{ left, top }}
    >
      {items.map((it) => (
        <button
          key={it.label}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
          onClick={it.fn}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── Reading pane ─────────────────────────────────────────────────────── */

function MessageView({
  message,
  folder,
  onBack,
  onRefresh,
  onReply,
  onReplyAll,
  onForward,
  onTrash,
  onArchive,
  onSpam,
  onStar,
  onUnread,
  onSnooze,
  onMove,
}: {
  message: MailMessage | null;
  folder: string;
  onBack: () => void;
  onRefresh: () => void;
  onReply: (m: MailMessage) => void;
  onReplyAll: (m: MailMessage) => void;
  onForward: (m: MailMessage) => void;
  onTrash: (m: MailMessage, folder: string) => void;
  onArchive: (m: MailMessage, folder: string) => void;
  onSpam: (m: MailMessage, folder: string) => void;
  onStar: (uid: number, folder: string, env?: MailEnvelope) => void;
  onUnread: (uid: number, folder: string, seen: boolean) => void;
  onSnooze: (m: MailMessage) => void;
  onMove: (m: MailMessage) => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const preview = mailStore((s) => s.preview);

  if (!message) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Search size={40} className="opacity-40" />
        <p>Select a message to read it</p>
      </div>
    );
  }

  const download = async (part: string, filename: string) => {
    setDownloading(part);
    try {
      const res = await import("@/lib/mail").then((m) =>
        m.mailApi.downloadAttachment(message.uid, folder, part)
      );
      const a = document.createElement("a");
      a.href = res.url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(res.url);
    } catch {
      toast.error("Could not download attachment");
    } finally {
      setDownloading(null);
    }
  };

  const starred = message.flags.includes("\\Flagged");

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
          <ChevronLeft /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" title="Reply" onClick={() => onReply(message)}>
            <Reply /> <span className="hidden sm:inline">Reply</span>
          </Button>
          <Button variant="ghost" size="sm" title="Reply all" onClick={() => onReplyAll(message)}>
            <Reply className="rotate-180" />
          </Button>
          <Button variant="ghost" size="sm" title="Forward" onClick={() => onForward(message)}>
            <ForwardIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={starred ? "Unstar" : "Star"}
            onClick={() => onStar(message.uid, folder)}
          >
            <Star
              size={16}
              className={cn(starred && "fill-primary text-primary")}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Mark as unread"
            onClick={() => onUnread(message.uid, folder, false)}
          >
            <MailOpen size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Snooze" onClick={() => onSnooze(message)}>
            <Clock size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Move to folder" onClick={() => onMove(message)}>
            <FolderInput size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Print" onClick={() => window.print()}>
            <Printer size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Archive"
            onClick={() => onArchive(message, folder)}
          >
            <Archive size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Spam"
            onClick={() => onSpam(message, folder)}
          >
            <Ban size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Delete"
            onClick={() => onTrash(message, folder)}
          >
            <Trash2 className="text-destructive" size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Refresh" onClick={onRefresh}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          <h2 className="mb-4 text-lg font-bold leading-snug">{message.subject}</h2>
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={addr(message.from)} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{addr(message.from)}</div>
              <div className="truncate text-xs text-muted-foreground">
                to {addr(message.to)}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end text-xs text-muted-foreground">
              <span>{fmtFullDate(message.date)}</span>
              <span className="flex items-center gap-1">
                {preview && <Clock size={11} />}
                {preview ? "preview" : folder}
              </span>
            </div>
          </div>

          {message.html ? (
            <iframe
              sandbox=""
              title="email-body"
              srcDoc={message.html}
              className="h-[60vh] w-full rounded-md border bg-background"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
          )}

          {message.attachments.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <PaperclipIcon size={14} /> {message.attachments.length} attachment(s)
              </p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((a) => (
                  <Button
                    key={a.part}
                    variant="outline"
                    size="sm"
                    onClick={() => download(a.part, a.filename)}
                    disabled={downloading === a.part}
                    title={`${a.filename} (${(a.size / 1024).toFixed(0)} KB)`}
                  >
                    {downloading === a.part ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <PaperclipIcon size={13} />
                    )}
                    <span className="max-w-40 truncate">{a.filename}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ForwardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12a7 7 0 1 0 14 0" />
      <path d="M12 4l4 4-4 4" />
      <path d="M16 8H8" />
    </svg>
  );
}

function PaperclipIcon({ size }: { size?: number }) {
  return (
    <svg
      width={size || 14}
      height={size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
