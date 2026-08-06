/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Search,
  PenSquare,
  LogOut,
  User,
  Settings,
  HelpCircle,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/global/ThemeSwitcher";
import { mailStore } from "@/lib/mailStore";
import { cn } from "@/lib/utils";
import { LoginView } from "./LoginView";
import { MailboxView } from "./MailboxView";
import { ContactsView } from "./ContactsView";
import { SettingsView } from "./SettingsView";
import { ComposeDialog } from "./ComposeDialog";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { Avatar, FOLDER_ICONS, GLASS } from "./mail-utils";

export function MailApp() {
  const token = mailStore((s) => s.token);
  const preview = mailStore((s) => s.preview);
  const email = mailStore((s) => s.email);
  const view = mailStore((s) => s.view);
  const folders = mailStore((s) => s.folders);
  const activeFolder = mailStore((s) => s.activeFolder);
  const list = mailStore((s) => s.list);
  const selected = mailStore((s) => s.selected);
  const loadingList = mailStore((s) => s.loadingList);
  const query = mailStore((s) => s.query);
  const shortcutsOpen = mailStore((s) => s.shortcutsOpen);
  const hydrate = mailStore((s) => s.hydrate);
  const setActiveFolder = mailStore((s) => s.setActiveFolder);
  const setView = mailStore((s) => s.setView);
  const setShortcutsOpen = mailStore((s) => s.setShortcutsOpen);
  const setQuery = mailStore((s) => s.setQuery);
  const refresh = mailStore((s) => s.refresh);
  const logout = mailStore((s) => s.logout);
  const openCompose = mailStore((s) => s.openCompose);

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = !!token || preview;

  if (!isLoggedIn) return <LoginView />;

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-card md:flex">
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
            className={cn(
              "w-full gap-2 rounded-xl bg-primary text-primary-foreground",
              "dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
            )}
            onClick={() => openCompose("new")}
          >
            <PenSquare size={16} /> Compose
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {view === "mail" &&
            folders.map((f) => {
              const Icon = FOLDER_ICONS[f.specialUse || ""] || FOLDER_ICONS[f.path] || Search;
              const active = f.path === activeFolder;
              return (
                <button
                  key={f.path}
                  onClick={() => setActiveFolder(f.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary font-medium text-primary-foreground dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1 truncate text-left">
                    {f.name === "INBOX" ? "Inbox" : f.name}
                  </span>
                  {(f.total ?? 0) > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {f.total}
                    </span>
                  )}
                </button>
              );
            })}

          <div className={cn("my-2 h-px bg-border/60", view !== "mail" && "mt-0")} />

          <button
            onClick={() => setView("mail")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              view === "mail"
                ? "bg-primary font-medium text-primary-foreground dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <BadgeCheck size={17} className="shrink-0" />
            <span className="flex-1 truncate text-left">Mailbox</span>
          </button>
          <button
            onClick={() => setView("contacts")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              view === "contacts"
                ? "bg-primary font-medium text-primary-foreground dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <User size={17} className="shrink-0" />
            <span className="flex-1 truncate text-left">Contacts</span>
          </button>
          <button
            onClick={() => setView("settings")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              view === "settings"
                ? "bg-primary font-medium text-primary-foreground dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Settings size={17} className="shrink-0" />
            <span className="flex-1 truncate text-left">Settings</span>
          </button>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={email} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{email}</div>
              <div className="text-xs text-muted-foreground">
                {preview ? "Preview mode" : "Signed in"}
              </div>
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
          {view === "mail" ? (
            <div className="relative min-w-0 flex-1 max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refresh();
                }}
                className="h-10 rounded-xl pl-9"
              />
            </div>
          ) : (
            <h2 className="text-lg font-bold capitalize">{view}</h2>
          )}
          {preview && (
            <Badge variant="outline" className="hidden gap-1 sm:inline-flex">
              Preview
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle size={17} />
            </Button>
            <Button variant="ghost" size="icon" onClick={refresh} title="Refresh">
              <RefreshCw size={17} />
            </Button>
            <Button
              className={cn(
                "hidden gap-2 rounded-xl bg-primary text-primary-foreground sm:inline-flex",
                "dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
              )}
              onClick={() => openCompose("new")}
            >
              <PenSquare size={15} /> Compose
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              className="md:hidden"
            >
              <LogOut size={17} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex min-h-0 flex-1">
          {view === "mail" && <MailboxView />}
          {view === "contacts" && <ContactsView />}
          {view === "settings" && <SettingsView />}
        </div>
      </div>

      <ComposeDialog />
      {shortcutsOpen && <ShortcutsDialog />}

      <style>{`
        .mail-app .site-header, .mail-app .site-footer { display: none !important; }
      `}</style>
    </div>
  );
}
