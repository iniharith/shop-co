/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect } from "react";
import { mailStore } from "@/lib/mailStore";

export function useMailShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      const s = mailStore.getState();

      // "?" / "h" always
      if (e.key === "?" || e.key === "h") {
        e.preventDefault();
        s.setShortcutsOpen(!s.shortcutsOpen);
        return;
      }
      if (e.key === "Escape") {
        if (s.ctx) s.setCtx(null);
        return;
      }
      if (isTyping) return;
      if (s.compose.open || s.shortcutsOpen) return;

      const list = s.list;
      const idx = s.selected ? list.findIndex((m) => m.uid === s.selected?.uid) : -1;

      switch (e.key) {
        case "c":
          e.preventDefault();
          s.openCompose("new");
          break;
        case "r":
          e.preventDefault();
          if (s.message) s.openCompose("reply", s.message);
          break;
        case "a":
          e.preventDefault();
          if (s.message) s.openCompose("reply-all", s.message);
          break;
        case "f":
          e.preventDefault();
          if (s.message) s.openCompose("forward", s.message);
          break;
        case "/":
          e.preventDefault();
          (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus();
          break;
        case "j":
        case "k": {
          e.preventDefault();
          if (!list.length) break;
          const delta = e.key === "j" ? 1 : -1;
          const next = list[Math.min(list.length - 1, Math.max(0, idx + delta))];
          if (next) s.openMessage(next);
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (s.selected && !s.message) s.openMessage(s.selected);
          break;
        }
        case "u":
          e.preventDefault();
          s.closeMessage();
          break;
        case "s":
          e.preventDefault();
          if (s.selected) s.toggleFlag(s.selected.uid, s.selected.folder || s.activeFolder);
          break;
        case "e":
          e.preventDefault();
          if (s.selected) s.archive(s.selected.uid, s.selected.folder || s.activeFolder);
          break;
        case "#":
          e.preventDefault();
          if (s.selected) s.trash(s.selected.uid, s.selected.folder || s.activeFolder);
          break;
        case "m":
          e.preventDefault();
          if (s.selected) s.setSeen(s.selected.uid, s.selected.folder || s.activeFolder, false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
