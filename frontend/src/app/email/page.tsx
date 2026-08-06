/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Star,
  RefreshCw,
  Mail as MailIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Reply,
  Plus,
  LogOut,
  Paperclip,
  Search,
  Clock,
  PenSquare,
} from "lucide-react";
import { FaEnvelope, FaLock } from "react-icons/fa6";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  mailApi,
  getToken,
  getMailEmail,
  clearMailSession,
  type MailFolder,
  type MailEnvelope,
  type MailMessage,
  type MailAddress,
} from "@/lib/mail";

const FOLDER_ICONS: Record<string, React.ElementType> = {
  INBOX: Inbox,
  "\\Inbox": Inbox,
  "\\Sent": Send,
  "\\Drafts": FileText,
  "\\Trash": Trash2,
  "\\Flagged": Star,
};

function addr(a: MailAddress[]) {
  if (!a || !a.length) return "";
  return a.map((x) => x.name || x.address).join(", ");
}

function fmtDate(iso: string | null) {
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
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function Avatar({ name, className }: { name: string; className?: string }) {
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

function LoginScreen({
  onLoggedIn,
  email,
  setEmail,
}: {
  onLoggedIn: () => void;
  email: string;
  setEmail: (e: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await mailApi.login(email.trim(), password);
      toast.success("Signed in");
      onLoggedIn();
    } catch (err: any) {
      setErr(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a href="/" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex h-12 items-center justify-center rounded-md">
                  <Image
                    src="/images/kampung-cetak-logo.png"
                    width={120}
                    height={40}
                    alt="Kampung Cetak"
                    className="object-contain"
                  />
                </div>
                <span className="sr-only">Kampung Cetak</span>
              </a>
              <h1 className="text-xl font-bold">Welcome to Kampung Cetak</h1>
              <div className="text-center text-sm text-muted-foreground">
                Login to your <span className="font-medium text-foreground">@kampungcetak.com</span> mail
              </div>
            </div>

            <form onSubmit={submit} className="grid w-full gap-4 py-4 md:px-3">
              {err && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {err}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="mail-email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mail-email"
                    type="email"
                    placeholder="you@kampungcetak.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="mail-pass" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mail-pass"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <MailIcon />
                )}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Your password is sent only to your own mail server to authenticate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
  onSent,
  replyTo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: () => void;
  replyTo?: MailMessage | null;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ filename: string; base64: string; contentType: string }[]>([]);

  useEffect(() => {
    if (open && replyTo) {
      const tos = replyTo.from?.length
        ? replyTo.from
            .filter((f) => f.address)
            .map((f) => f.address)
            .join(", ")
        : "";
      setTo(tos);
      setSubject(replyTo.subject?.startsWith("Re:")
        ? replyTo.subject
        : `Re: ${replyTo.subject || ""}`);
      setBody(
        `\n\n\n----\nOn ${new Date(replyTo.date).toLocaleString()}, ${addr(replyTo.from)} wrote:\n${(replyTo.text || "").slice(0, 2000)}`
      );
      setFiles([]);
    } else if (open) {
      setTo("");
      setSubject("");
      setBody("");
      setFiles([]);
    }
  }, [open, replyTo]);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const next: typeof files = [];
    for (const f of list) {
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      next.push({
        filename: f.name,
        contentType: f.type || "application/octet-stream",
        base64: btoa(bin),
      });
    }
    setFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const send = async () => {
    setLoading(true);
    try {
      await mailApi.send({
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
        attachments: files,
      });
      toast.success("Email sent");
      onOpenChange(false);
      onSent();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{replyTo ? "Reply" : "New message"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            rows={12}
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="resize-none font-normal"
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="gap-1 py-1 pr-1"
                >
                  <Paperclip size={12} />
                  {f.filename}
                  <button
                    type="button"
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <label className="cursor-pointer">
            <input type="file" multiple hidden onChange={onFiles} />
            <Button type="button" variant="outline" asChild={false}>
              <Paperclip /> Attach
            </Button>
          </label>
          <Button onClick={send} disabled={loading || !to.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageView({
  message,
  folder,
  onBack,
  onRefresh,
  onReply,
  onTrash,
}: {
  message: MailMessage | null;
  folder: string;
  onBack: () => void;
  onRefresh: () => void;
  onReply: (m: MailMessage) => void;
  onTrash: () => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!message) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MailIcon size={40} className="opacity-40" />
        <p>Select a message to read it</p>
      </div>
    );
  }

  const download = async (part: string, filename: string) => {
    setDownloading(part);
    try {
      const { url } = await mailApi.downloadAttachment(message.uid, folder, part);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download attachment");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
          <ChevronLeft /> Back
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onReply(message)}>
            <Reply /> Reply
          </Button>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw />
          </Button>
          <Button variant="ghost" size="sm" onClick={onTrash}>
            <Trash2 className="text-destructive" />
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
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {new Date(message.date).toLocaleString()}
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
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.text}
            </div>
          )}

          {message.attachments.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Paperclip size={14} /> {message.attachments.length} attachment(s)
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
                      <Paperclip size={13} />
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

export default function MailPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState("INBOX");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<MailEnvelope[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [selected, setSelected] = useState<MailEnvelope | null>(null);
  const [message, setMessage] = useState<MailMessage | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MailMessage | null>(null);
  const [query, setQuery] = useState("");

  const isLoggedIn = !!token;

  useEffect(() => {
    const t = getToken();
    const e = getMailEmail();
    if (t) {
      setToken(t);
      setEmail(e);
    }
  }, []);

  const loadFolders = async () => {
    try {
      const f = await mailApi.folders();
      setFolders(f);
    } catch {
      /* folder list optional */
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadFolders();
  }, [isLoggedIn]);

  const loadMessages = async (folder: string, pg: number, silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await mailApi.messages(folder, pg, pageSize);
      setList(res.items);
      setTotal(res.total);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setToken("");
        clearMailSession();
      } else {
        toast.error("Failed to load messages");
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setSelected(null);
    setMessage(null);
    setPage(1);
    loadMessages(activeFolder, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeFolder]);

  const openMessage = async (env: MailEnvelope) => {
    setSelected(env);
    setLoadingMsg(true);
    try {
      const m = await mailApi.message(env.uid, activeFolder);
      setMessage(m);
      if (!m.seen) {
        mailApi.setSeen(env.uid, activeFolder, true).catch(() => undefined);
        setList((prev) =>
          prev.map((x) => (x.uid === env.uid ? { ...x, seen: true } : x))
        );
      }
    } catch {
      toast.error("Could not open message");
    } finally {
      setLoadingMsg(false);
    }
  };

  const trashMessage = async () => {
    if (!selected) return;
    await mailApi.trash(selected.uid, activeFolder).catch(() => toast.error("Delete failed"));
    setMessage(null);
    setSelected(null);
    loadMessages(activeFolder, page, true);
    toast.success("Moved to Trash");
  };

  const logout = async () => {
    await mailApi.logout();
    setToken("");
    setFolders([]);
    setList([]);
    setMessage(null);
    setSelected(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filteredList = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        addr(m.from).toLowerCase().includes(q)
    );
  }, [list, query]);

  if (!isLoggedIn) {
    return (
      <LoginScreen
        email={email}
        setEmail={setEmail}
        onLoggedIn={() => {
          setToken(getToken());
        }}
      />
    );
  }

  const folderLabel = folders.find((f) => f.path === activeFolder)?.name || activeFolder;

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <Image
            src="/images/kampung-cetak-logo.png"
            width={120}
            height={40}
            alt="Kampung Cetak"
            className="object-contain"
          />
        </div>

        <div className="px-4 pb-3">
          <Button
            className="w-full gap-2 rounded-xl"
            onClick={() => { setReplyTo(null); setComposeOpen(true); }}
          >
            <PenSquare size={16} /> Compose
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {folders.map((f) => {
            const Icon = FOLDER_ICONS[f.specialUse || ""] || Inbox;
            const active = f.path === activeFolder;
            const unread =
              (f.specialUse === "\\Inbox" || f.path === "INBOX") && f.total > 0
                ? f.total
                : f.total;
            return (
              <button
                key={f.path}
                onClick={() => setActiveFolder(f.path)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={17} className="shrink-0" />
                <span className="flex-1 truncate text-left">
                  {f.name === "INBOX" ? "Inbox" : f.name}
                </span>
                {unread > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={email} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{email}</div>
              <div className="text-xs text-muted-foreground">Signed in</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/images/kampung-cetak-logo.png"
              width={80}
              height={28}
              alt="Kampung Cetak"
              className="object-contain"
            />
          </div>
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadMessages(activeFolder, page, true)}
              title="Refresh"
            >
              <RefreshCw size={17} />
            </Button>
            <Button
              className="hidden gap-2 rounded-xl sm:inline-flex"
              onClick={() => { setReplyTo(null); setComposeOpen(true); }}
            >
              <PenSquare size={15} /> Compose
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out" className="md:hidden">
              <LogOut size={17} />
            </Button>
          </div>
        </header>

        {/* Content: list + reading pane */}
        <div className="flex min-h-0 flex-1">
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
                  const Icon = FOLDER_ICONS[activeFolder] || Inbox;
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
              ) : filteredList.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No messages
                </div>
              ) : (
                filteredList.map((m) => (
                  <button
                    key={m.uid}
                    onClick={() => openMessage(m)}
                    className={cn(
                      "flex w-full gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-accent/60",
                      selected?.uid === m.uid && "bg-accent",
                      !m.seen && "bg-primary/[0.04]"
                    )}
                  >
                    <div className="relative mt-0.5 size-2 shrink-0">
                      {!m.seen && (
                        <span className="absolute size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            !m.seen ? "font-semibold" : "font-normal"
                          )}
                        >
                          {addr(m.from) || m.subject}
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
                  onClick={() => {
                    setPage((p) => p - 1);
                    loadMessages(activeFolder, page - 1, true);
                  }}
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
                  onClick={() => {
                    setPage((p) => p + 1);
                    loadMessages(activeFolder, page + 1, true);
                  }}
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
                onBack={() => setSelected(null)}
                onRefresh={() => loadMessages(activeFolder, page, true)}
                onReply={(m) => { setReplyTo(m); setComposeOpen(true); }}
                onTrash={trashMessage}
              />
            </div>
          )}
        </div>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyTo={replyTo}
        onSent={() => {
          loadMessages(activeFolder, 1, true);
          loadFolders();
        }}
      />
    </div>
  );
}
