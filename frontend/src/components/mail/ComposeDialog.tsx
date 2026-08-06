/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Paperclip, Bold, Italic, List, ChevronDown, Save } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mailStore } from "@/lib/mailStore";

export function ComposeDialog() {
  const compose = mailStore((s) => s.compose);
  const email = mailStore((s) => s.email);
  const settings = mailStore((s) => s.settings);
  const setCompose = mailStore((s) => s.setCompose);
  const closeCompose = mailStore((s) => s.closeCompose);
  const saveDraft = mailStore((s) => s.saveDraft);
  const send = mailStore((s) => s.send);

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const { open, mode, draftTo, draftCc, draftBcc, draftSubject, draftBody, draftFiles } = compose;

  useEffect(() => {
    if (!open) {
      setShowCc(false);
      setShowBcc(false);
      return;
    }
    const sig = settings.signature;
    if (mode === "new" && !draftSubject && !draftBody && sig) {
      setCompose({ draftBody: `\n\n${sig}` });
    }
  }, [open, mode, settings.signature]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Draft autosave (debounced) */
  useEffect(() => {
    if (!open) return;
    const hasContent = draftTo.length || draftCc.length || draftBcc.length || draftSubject || draftBody;
    if (!hasContent) return;
    const t = setTimeout(async () => {
      await saveDraft(true);
      setSaved(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [open, draftTo, draftCc, draftBcc, draftSubject, draftBody]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setSaved(false);
      setLoading(false);
    }
  }, [open]);

  const toInput = (arr: string[]) => arr.join(", ");

  const parseList = (s: string) =>
    s
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const next: typeof draftFiles = [];
    for (const f of list) {
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      next.push({ filename: f.name, contentType: f.type || "application/octet-stream", base64: btoa(bin) });
    }
    setCompose({ draftFiles: [...draftFiles, ...next] });
    e.target.value = "";
  };

  const execCmd = (cmd: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = draftBody.slice(start, end) || "text";
    const wrap = cmd === "bold" ? "**" : cmd === "italic" ? "_" : "";
    const replacement =
      cmd === "insertUnorderedList"
        ? sel.split("\n").map((l) => `- ${l}`).join("\n")
        : `${wrap}${sel}${wrap}`;
    const next = draftBody.slice(0, start) + replacement + draftBody.slice(end);
    setCompose({ draftBody: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + replacement.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const doSend = async () => {
    setLoading(true);
    try {
      await send();
    } finally {
      setLoading(false);
    }
  };

  const doSaveDraft = async () => {
    setLoading(true);
    try {
      await saveDraft(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeCompose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "reply" ? "Reply" : mode === "reply-all" ? "Reply all" : mode === "forward" ? "Forward" : "New message"}
            {draftFiles.length > 0 && ` · ${draftFiles.length} attachment(s)`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm text-muted-foreground">To</span>
              <Input
                placeholder="recipient@example.com"
                value={toInput(draftTo)}
                onChange={(e) => setCompose({ draftTo: parseList(e.target.value) })}
              />
              <button
                type="button"
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowCc((v) => !v)}
              >
                Cc
              </button>
              <button
                type="button"
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowBcc((v) => !v)}
              >
                Bcc
              </button>
            </div>
            {showCc && (
              <div className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-sm text-muted-foreground">Cc</span>
                <Input
                  placeholder="cc@example.com"
                  value={toInput(draftCc)}
                  onChange={(e) => setCompose({ draftCc: parseList(e.target.value) })}
                />
              </div>
            )}
            {showBcc && (
              <div className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-sm text-muted-foreground">Bcc</span>
                <Input
                  placeholder="bcc@example.com"
                  value={toInput(draftBcc)}
                  onChange={(e) => setCompose({ draftBcc: parseList(e.target.value) })}
                />
              </div>
            )}
          </div>
          <Input
            placeholder="Subject"
            value={draftSubject}
            onChange={(e) => setCompose({ draftSubject: e.target.value })}
          />

          {/* Rich text toolbar */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1">
            <ToolbarBtn title="Bold" onClick={() => execCmd("bold")}>
              <Bold size={14} />
            </ToolbarBtn>
            <ToolbarBtn title="Italic" onClick={() => execCmd("italic")}>
              <Italic size={14} />
            </ToolbarBtn>
            <ToolbarBtn title="Bullet list" onClick={() => execCmd("insertUnorderedList")}>
              <List size={14} />
            </ToolbarBtn>
            <ToolbarBtn title="Insert signature" onClick={() => insertSignature(settings.signature, draftBody, setCompose)}>
              <ChevronDown size={14} />
            </ToolbarBtn>
            <span className="ml-auto px-2 text-xs text-muted-foreground">
              {saved ? "Draft saved ✓" : "Autosaves drafts"}
            </span>
          </div>

          <textarea
            ref={bodyRef}
            rows={12}
            placeholder="Write your message…"
            value={draftBody}
            onChange={(e) => setCompose({ draftBody: e.target.value })}
            className="w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none focus:border-primary/50"
          />

          {draftFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draftFiles.map((f, i) => (
                <Badge key={i} variant="outline" className="gap-1 py-1 pr-1">
                  <Paperclip size={12} />
                  <span className="max-w-40 truncate">{f.filename}</span>
                  <button
                    type="button"
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setCompose({ draftFiles: draftFiles.filter((_, j) => j !== i) })}
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
            <Button type="button" variant="outline">
              <Paperclip /> Attach
            </Button>
          </label>
          <Button type="button" variant="outline" onClick={doSaveDraft} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save />} Save draft
          </Button>
          <Button onClick={doSend} disabled={loading || !draftTo.length}>
            {loading ? <Loader2 className="animate-spin" /> : <Send />} Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function insertSignature(
  sig: string,
  body: string,
  setCompose: (p: Partial<ReturnType<typeof mailStore.getState>["compose"]>) => void
) {
  if (!sig) return;
  const sep = body ? "\n\n" : "";
  setCompose({ draftBody: `${body}${sep}${sig}` });
}
