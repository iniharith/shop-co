/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState } from "react";
import { Palette, User, Bell, Plane, FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { mailStore } from "@/lib/mailStore";
import { GLASS } from "./mail-utils";

export function SettingsView() {
  const settings = mailStore((s) => s.settings);
  const email = mailStore((s) => s.email);
  const preview = mailStore((s) => s.preview);
  const updateSettings = mailStore((s) => s.updateSettings);
  const createFolder = mailStore((s) => s.createFolder);
  const folders = mailStore((s) => s.folders);
  const renameFolder = mailStore((s) => s.renameFolder);
  const deleteFolder = mailStore((s) => s.deleteFolder);

  const [folderName, setFolderName] = useState("");
  const [manageFolders, setManageFolders] = useState(false);

  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
  };

  const t = settings.theme;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <style suppressHydrationWarning>{`
        :root {
          ${t.fontColor ? `--foreground: ${hexToHSL(t.fontColor)};` : ""}
          ${t.buttonColor ? `--primary: ${hexToHSL(t.buttonColor)};` : ""}
          ${t.pointColor ? `--accent: ${hexToHSL(t.pointColor)}; --ring: ${hexToHSL(t.pointColor)};` : ""}
        }
        .dark {
          ${t.fontColor ? `--foreground: ${hexToHSL(t.fontColor)};` : ""}
          ${t.buttonColor ? `--primary: ${hexToHSL(t.buttonColor)};` : ""}
          ${t.pointColor ? `--accent: ${hexToHSL(t.pointColor)}; --ring: ${hexToHSL(t.pointColor)};` : ""}
        }
      `}</style>

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Account */}
        <section className={`${GLASS} p-6`}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <User size={16} /> Account
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Input value={preview ? "Preview (sample data)" : "Connected to mail server"} readOnly className="bg-muted/40" />
            </div>
          </div>
        </section>

        {/* Theme */}
        <section className={`${GLASS} p-6`}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <Palette size={16} /> Theme
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Button color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.buttonColor || "#10b981"}
                  onChange={(e) => updateSettings({ theme: { ...t, buttonColor: e.target.value } })}
                  className="h-10 w-16 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <Button variant="outline" size="sm" onClick={() => updateSettings({ theme: { ...t, buttonColor: "" } })}>
                  Reset
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.fontColor || "#ffffff"}
                  onChange={(e) => updateSettings({ theme: { ...t, fontColor: e.target.value } })}
                  className="h-10 w-16 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <Button variant="outline" size="sm" onClick={() => updateSettings({ theme: { ...t, fontColor: "" } })}>
                  Reset
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Accent / point color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.pointColor || "#10b981"}
                  onChange={(e) => updateSettings({ theme: { ...t, pointColor: e.target.value } })}
                  className="h-10 w-16 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <Button variant="outline" size="sm" onClick={() => updateSettings({ theme: { ...t, pointColor: "" } })}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Pick colors to personalize the whole webmail UI — buttons, accents and text update instantly.
          </p>
        </section>

        {/* Signature */}
        <section className={`${GLASS} p-6`}>
          <h3 className="mb-4 text-base font-bold">Signature</h3>
          <Textarea
            rows={4}
            placeholder="e.g.  Best regards,  Harith — Kampung Cetak"
            value={settings.signature}
            onChange={(e) => updateSettings({ signature: e.target.value })}
            className="resize-none"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Automatically appended to new messages. Use the toolbar in the compose window to insert it.
          </p>
        </section>

        {/* Vacation auto-reply */}
        <section className={`${GLASS} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <Plane size={16} /> Vacation auto-reply
            </h3>
            <Switch
              checked={settings.vacation.enabled}
              onCheckedChange={(v) => updateSettings({ vacation: { ...settings.vacation, enabled: v } })}
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                placeholder="Out of office"
                value={settings.vacation.subject}
                onChange={(e) => updateSettings({ vacation: { ...settings.vacation, subject: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                rows={3}
                placeholder="I'm currently away and will reply when I'm back…"
                value={settings.vacation.body}
                onChange={(e) => updateSettings({ vacation: { ...settings.vacation, body: e.target.value } })}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Saved on this device. Server-side auto-reply requires the mail server's Sieve script once deployed.
          </p>
        </section>

        {/* Notifications */}
        <section className={`${GLASS} p-6`}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <Bell size={16} /> Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Play a sound on new mail</div>
                <div className="text-xs text-muted-foreground">Beep when a new message arrives</div>
              </div>
              <Switch
                checked={settings.notifications.sound}
                onCheckedChange={(v) => updateSettings({ notifications: { ...settings.notifications, sound: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Desktop notifications</div>
                <div className="text-xs text-muted-foreground">Browser notification for new mail</div>
              </div>
              <Switch
                checked={settings.notifications.desktop}
                onCheckedChange={(v) => updateSettings({ notifications: { ...settings.notifications, desktop: v } })}
              />
            </div>
          </div>
        </section>

        {/* Folders */}
        <section className={`${GLASS} p-6`}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <FolderPlus size={16} /> Folders
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="New folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  createFolder(folderName.trim());
                  setFolderName("");
                }
              }}
            />
            <Button
              disabled={!folderName.trim()}
              onClick={() => {
                createFolder(folderName.trim());
                setFolderName("");
              }}
            >
              Create
            </Button>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => setManageFolders(true)}>
              Manage folders
            </Button>
          </div>
        </section>
      </div>

      {manageFolders && (
        <Dialog open onOpenChange={(v) => !v && setManageFolders(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage folders</DialogTitle>
            </DialogHeader>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {folders.map((f) => (
                <FolderRow key={f.path} path={f.path} onRename={renameFolder} onDelete={deleteFolder} />
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManageFolders(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function FolderRow({
  path,
  onRename,
  onDelete,
}: {
  path: string;
  onRename: (path: string, newName: string) => void;
  onDelete: (path: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(path);
  const isSystem = path.startsWith("\\");

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                onRename(path, name.trim());
                setEditing(false);
              }
            }}
            className="h-8 flex-1"
          />
          <Button size="sm" onClick={() => { onRename(path, name.trim()); setEditing(false); }}>
            Save
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-sm">{path === "INBOX" ? "Inbox" : path.replace(/^\\/, "")}</span>
          {!isSystem && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Rename
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(path)}>
                Delete
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
