/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mailApi.login(email.trim(), password);
      toast.success("Signed in");
      onLoggedIn();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <MailIcon size={26} />
      </div>
      <h1 className="mb-1 text-2xl font-bold">Kampung Cetak Mail</h1>
      <p className="mb-8 text-muted-foreground">
        Sign in with your <span className="font-medium text-foreground">@kampungcetak.com</span> address
      </p>
      <form onSubmit={submit} className="w-full space-y-4">
        <div className="space-y-2">
          <label htmlFor="mail-email" className="text-sm font-medium">
            Email address
          </label>
          <Input
            id="mail-email"
            type="email"
            placeholder="you@kampungcetak.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="mail-pass" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="mail-pass"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <MailIcon />}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your password is sent only to your own mail server to authenticate.
      </p>
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
    <div className="mx-auto flex h-[calc(100vh-180px)] w-full max-w-7xl flex-col px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MailIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Kampung Cetak Mail</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48 pl-8"
            />
          </div>
          <Button onClick={() => { setReplyTo(null); setComposeOpen(true); }}>
            <Plus /> Compose
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Folders */}
        <aside className="hidden w-52 shrink-0 flex-col border-r bg-muted/30 sm:flex">
          <div className="flex-1 overflow-y-auto p-2">
            {folders.map((f) => {
              const Icon = FOLDER_ICONS[f.specialUse || ""] || Inbox;
              const active = f.path === activeFolder;
              return (
                <button
                  key={f.path}
                  onClick={() => setActiveFolder(f.path)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate text-left">
                    {f.name === "INBOX" ? "Inbox" : f.name}
                  </span>
                  {f.total > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-xs",
                        active ? "bg-primary-foreground/20" : "bg-muted"
                      )}
                    >
                      {f.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Message list */}
        <div className={cn(
            "w-full flex-col border-r lg:w-80 lg:shrink-0",
            selected ? "hidden lg:flex" : "flex"
          )}>

          <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium capitalize">
              {folderLabel === "INBOX" ? "Inbox" : folderLabel}
            </span>
            <span>
              {total} message{total === 1 ? "" : "s"}
            </span>
          </div>
          <div className="border-b p-2 sm:hidden">
            <select
              value={activeFolder}
              onChange={(e) => setActiveFolder(e.target.value)}
              className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
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
                    "flex w-full gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-accent/60",
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
            <div className="flex items-center justify-between border-t px-3 py-2">
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
          <div className={cn("flex-1", selected ? "flex" : "hidden lg:flex")}>
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
