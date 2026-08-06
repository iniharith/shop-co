/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { create } from "zustand";
import { toast } from "sonner";
import {
  mailApi,
  getToken,
  getMailEmail,
  getPreviewMode,
  setPreviewMode,
  clearMailSession,
  getContacts,
  setContacts,
  getSettings,
  setSettings,
  getSnoozed,
  setSnoozed,
  PREVIEW_FOLDERS,
  PREVIEW_LIST,
  PREVIEW_MESSAGE,
  PREVIEW_SENT,
  PREVIEW_DRAFTS,
  PREVIEW_JUNK,
  PREVIEW_TRASH,
  PREVIEW_ARCHIVE,
  PREVIEW_CONTACTS,
  type MailFolder,
  type MailEnvelope,
  type MailMessage,
  type MailAddress,
  type MailContact,
  type MailSettings,
  type MailFilters,
  type DraftPayload,
} from "@/lib/mail";

export type ComposeState = {
  open: boolean;
  mode: "new" | "reply" | "reply-all" | "forward";
  replyTo: MailMessage | null;
  draftTo: string[];
  draftCc: string[];
  draftBcc: string[];
  draftSubject: string;
  draftBody: string;
  draftFiles: { filename: string; base64: string; contentType: string }[];
  editingUid?: number;
};

export type MailView = "mail" | "contacts" | "settings";

const SNOOZE_VIRTUAL = "\\Snoozed";

type PreviewStore = {
  folders: MailFolder[];
  lists: Record<string, MailEnvelope[]>;
  messages: Record<string, MailMessage>;
};

function initPreviewStore(): PreviewStore {
  const folders = PREVIEW_FOLDERS.map((f) => ({ ...f }));
  return {
    folders,
    lists: {
      INBOX: PREVIEW_LIST.map((m) => ({ ...m })),
      "\\Flagged": PREVIEW_LIST.filter((m) => m.flags.includes("\\Flagged")).map((m) => ({ ...m })),
      "\\Sent": PREVIEW_SENT.map((m) => ({ ...m })),
      "\\Drafts": PREVIEW_DRAFTS.map((m) => ({ ...m })),
      "\\Junk": PREVIEW_JUNK.map((m) => ({ ...m })),
      "\\Trash": PREVIEW_TRASH.map((m) => ({ ...m })),
      Archive: PREVIEW_ARCHIVE.map((m) => ({ ...m })),
      Projects: [],
    },
    messages: {},
  };
}

interface MailState {
  /* session */
  token: string;
  email: string;
  preview: boolean;
  view: MailView;
  shortcutsOpen: boolean;

  /* mailbox */
  folders: MailFolder[];
  activeFolder: string;
  page: number;
  pageSize: number;
  list: MailEnvelope[];
  total: number;
  selected: MailEnvelope | null;
  message: MailMessage | null;
  loadingList: boolean;
  loadingMsg: boolean;

  /* search */
  query: string;
  filters: MailFilters;

  /* data */
  contacts: MailContact[];
  settings: MailSettings;
  snoozed: Record<string, string>;

  /* compose */
  compose: ComposeState;

  /* context menu */
  ctx: { x: number; y: number; env: MailEnvelope } | null;

  /* preview internal state */
  pv: PreviewStore | null;

  /* actions */
  hydrate: () => void;
  enterPreview: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setView: (v: MailView) => void;
  setShortcutsOpen: (v: boolean) => void;

  loadFolders: () => Promise<void>;
  loadMessages: (folder?: string, pg?: number, silent?: boolean) => Promise<void>;
  openMessage: (env: MailEnvelope) => Promise<void>;
  setActiveFolder: (f: string) => void;
  setPage: (p: number) => void;
  setQuery: (q: string) => void;
  setFilters: (f: MailFilters) => void;
  refresh: () => Promise<void>;
  closeMessage: () => void;

  setSeen: (uid: number, folder: string, seen: boolean, env?: MailEnvelope) => Promise<void>;
  toggleFlag: (uid: number, folder: string, env?: MailEnvelope) => Promise<void>;
  moveTo: (uid: number, folder: string, target: string, label?: string) => Promise<void>;
  trash: (uid: number, folder: string, env?: MailEnvelope) => Promise<void>;
  archive: (uid: number, folder: string) => Promise<void>;
  spam: (uid: number, folder: string) => Promise<void>;
  snooze: (uid: number, folder: string, until: string) => Promise<void>;
  unsnooze: (key: string) => Promise<void>;
  applyToAll: (uids: number[], fn: (uid: number) => Promise<void>) => Promise<void>;

  createFolder: (name: string) => Promise<void>;
  renameFolder: (path: string, newName: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;

  openCompose: (mode?: ComposeState["mode"], replyTo?: MailMessage | null, prefill?: Partial<ComposeState>) => void;
  closeCompose: () => void;
  setCompose: (patch: Partial<ComposeState>) => void;
  saveDraft: (silent?: boolean) => Promise<void>;
  send: () => Promise<void>;

  addContact: (c: Omit<MailContact, "id">) => void;
  updateContact: (c: MailContact) => void;
  deleteContact: (id: string) => void;

  updateSettings: (s: Partial<MailSettings>) => void;

  setCtx: (c: MailState["ctx"]) => void;
}

export const mailStore = create<MailState>((set, get) => {
  const persistContacts = () => setContacts(get().contacts);
  const persistSettings = () => setSettings(get().settings);
  const persistSnoozed = () => setSnoozed(get().snoozed);

  return {
    token: "",
    email: "",
    preview: false,
    view: "mail",
    shortcutsOpen: false,

    folders: [],
    activeFolder: "INBOX",
    page: 1,
    pageSize: 50,
    list: [],
    total: 0,
    selected: null,
    message: null,
    loadingList: false,
    loadingMsg: false,

    query: "",
    filters: {},

    contacts: [],
    settings: getSettings(),
    snoozed: {},

    compose: {
      open: false,
      mode: "new",
      replyTo: null,
      draftTo: [],
      draftCc: [],
      draftBcc: [],
      draftSubject: "",
      draftBody: "",
      draftFiles: [],
    },

    ctx: null,
    pv: null,

    /* ── session ─────────────────────────────────────────────────── */
    hydrate: () => {
      const token = getToken();
      const email = getMailEmail();
      set({ snoozed: getSnoozed() });
      if (token) {
        set({ token, email, preview: false });
        get().loadFolders();
        get().loadMessages();
      } else if (getPreviewMode()) {
        set({ preview: true, email: email || "preview@kampungcetak.com", pv: initPreviewStore() });
        get().loadFolders();
        get().loadMessages();
      }
    },

    enterPreview: () => {
      setPreviewMode(true);
      set({ preview: true, email: "preview@kampungcetak.com", pv: initPreviewStore() });
      toast.success("Preview mode — sample data only");
      get().loadFolders();
      get().loadMessages();
    },

    login: async (email: string, password: string) => {
      await mailApi.login(email.trim(), password);
      set({ token: getToken(), email, preview: false, pv: null });
      toast.success("Signed in");
      get().loadFolders();
      get().loadMessages();
    },

    logout: async () => {
      const { preview } = get();
      if (!preview) await mailApi.logout();
      setPreviewMode(false);
      clearMailSession();
      set({
        token: "", email: "", preview: false, view: "mail",
        folders: [], list: [], total: 0, selected: null, message: null, pv: null,
        compose: { open: false, mode: "new", replyTo: null, draftTo: [], draftCc: [], draftBcc: [], draftSubject: "", draftBody: "", draftFiles: [] },
      });
    },

    setView: (view) => set({ view }),
    setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

    /* ── folders ─────────────────────────────────────────────────── */
    loadFolders: async () => {
      const { preview, pv } = get();
      if (preview) {
        set({ folders: pv ? pv.folders.map((f) => ({ ...f })) : [] });
        return;
      }
      try {
        const folders = await mailApi.folders();
        set({ folders });
      } catch {
        /* folder list optional */
      }
    },

    loadMessages: async (folder?: string, pg?: number, silent = false) => {
      const target = folder ?? get().activeFolder;
      const page = pg ?? get().page;
      const { preview, pv, query, filters } = get();

      if (preview) {
        const key = target === SNOOZE_VIRTUAL ? "INBOX" : target;
        let items = pv?.lists[key] || [];
        const snoozedKeys = Object.entries(get().snoozed).filter(([, until]) => new Date(until).getTime() > Date.now()).map(([k]) => k);
        if (target === SNOOZE_VIRTUAL) {
          items = items.filter((m) => snoozedKeys.includes(`${key}:${m.uid}`));
        } else {
          items = items.filter((m) => !snoozedKeys.includes(`${key}:${m.uid}`));
        }
        items = items.filter((m) => {
          if (filters.starred && !m.flags.includes("\\Flagged")) return false;
          if (filters.unread && m.seen) return false;
          if (filters.hasAttachment && !(m.attachments && m.attachments > 0)) return false;
          if (filters.from && !addrText(m.from).toLowerCase().includes(filters.from.toLowerCase())) return false;
          if (filters.to && !addrText(m.to).toLowerCase().includes(filters.to.toLowerCase())) return false;
          if (filters.subject && !m.subject.toLowerCase().includes(filters.subject.toLowerCase())) return false;
          if (filters.since && m.date && new Date(m.date) < new Date(filters.since)) return false;
          if (filters.before && m.date && new Date(m.date) > new Date(filters.before)) return false;
          if (query.trim()) {
            const q = query.toLowerCase();
            return m.subject.toLowerCase().includes(q) || addrText(m.from).toLowerCase().includes(q);
          }
          return true;
        });
        set({ list: items, total: items.length, page });
        return;
      }

      if (!silent) set({ loadingList: true });
      try {
        const res = await mailApi.messages(target, page, get().pageSize, { ...filters, ...(query.trim() ? { subject: query } : {}) });
        set({ list: res.items, total: res.total, page });
      } catch (err: any) {
        if (err?.response?.status === 401) {
          set({ token: "" });
          clearMailSession();
        } else {
          toast.error("Failed to load messages");
        }
      } finally {
        set({ loadingList: false });
      }
    },

    openMessage: async (env: MailEnvelope) => {
      const folder = env.folder || get().activeFolder;
      set({ selected: env, loadingMsg: true });
      try {
        let m: MailMessage;
        if (get().preview) {
          const cacheKey = `${folder}:${env.uid}`;
          const cached = get().pv?.messages?.[cacheKey];
          m = cached
            ? { ...cached }
            : { ...PREVIEW_MESSAGE, uid: env.uid, folder, subject: env.subject, from: env.from, to: env.to, date: env.date || new Date().toISOString() };
        } else {
          m = await mailApi.message(env.uid, folder);
        }
        set({ message: m });
        if (!m.seen) {
          setSeenLocal(m.uid, folder, true);
          get().setSeen(m.uid, folder, true).catch(() => undefined);
        }
      } catch {
        toast.error("Could not open message");
      } finally {
        set({ loadingMsg: false });
      }
    },

    setActiveFolder: (f) => {
      set({ activeFolder: f, selected: null, message: null, page: 1 });
      get().loadMessages(f, 1);
    },

    setPage: (p) => {
      set({ page: p });
      get().loadMessages(get().activeFolder, p, true);
    },

    setQuery: (q) => {
      set({ query: q });
    },
    setFilters: (f) => {
      set({ filters: f });
      get().loadMessages(get().activeFolder, 1, true);
    },

    refresh: async () => {
      await get().loadFolders();
      await get().loadMessages(get().activeFolder, get().page, true);
    },

    closeMessage: () => set({ selected: null, message: null }),

    /* ── actions ─────────────────────────────────────────────────── */
    setSeen: async (uid, folder, seen, env) => {
      if (get().preview) {
        setSeenLocal(uid, folder, seen);
        toast.success(seen ? "Marked as read" : "Marked as unread");
        return;
      }
      try {
        await mailApi.setSeen(uid, folder, seen);
        setSeenLocal(uid, folder, seen);
      } catch {
        toast.error("Failed to update message");
      }
    },

    toggleFlag: async (uid, folder, env) => {
      const inList = get().list.find((m) => m.uid === uid);
      const currently = inList ? inList.flags.includes("\\Flagged") : false;
      const next = !currently;
      if (get().preview) {
        toggleFlagLocal(uid, folder, next);
        toast.success(next ? "Starred" : "Unstarred");
        return;
      }
      try {
        await mailApi.setFlagged(uid, folder, next);
        toggleFlagLocal(uid, folder, next);
      } catch {
        toast.error("Failed to update star");
      }
    },

    moveTo: async (uid, folder, target, label) => {
      if (get().preview) {
        moveLocal(get(), uid, folder, target);
        toast.success(label || "Moved");
        get().loadFolders();
        return;
      }
      try {
        await mailApi.move(uid, folder, target);
        moveLocal(get(), uid, folder, target);
        toast.success(label || "Moved");
        get().loadFolders();
      } catch {
        toast.error("Could not move message");
      }
    },

    trash: async (uid, folder, env) => {
      if (get().preview) {
        moveLocal(get(), uid, folder, "\\Trash");
        toast.success("Moved to Trash");
        return;
      }
      try {
        await mailApi.trash(uid, folder);
        moveLocal(get(), uid, folder, "\\Trash");
        toast.success("Moved to Trash");
      } catch {
        toast.error("Delete failed");
      }
    },

    archive: async (uid, folder) => {
      await get().moveTo(uid, folder, "Archive", "Archived");
    },

    spam: async (uid, folder) => {
      await get().moveTo(uid, folder, "\\Junk", "Marked as spam");
    },

    snooze: async (uid, folder, until) => {
      const key = `${folder}:${uid}`;
      const snoozed = { ...get().snoozed, [key]: until };
      set({ snoozed });
      persistSnoozed();
      moveLocal(get(), uid, folder, folder);
      toast.success(`Snoozed until ${new Date(until).toLocaleString()}`);
    },

    unsnooze: async (key) => {
      const snoozed = { ...get().snoozed };
      delete snoozed[key];
      set({ snoozed });
      persistSnoozed();
      if (get().activeFolder === SNOOZE_VIRTUAL) get().loadMessages();
      toast.success("Unsnoozed — back in your inbox");
    },

    applyToAll: async (uids, fn) => {
      for (const uid of uids) {
        await fn(uid);
      }
      get().loadMessages(get().activeFolder, get().page, true);
      get().loadFolders();
    },

    /* ── folder management ───────────────────────────────────────── */
    createFolder: async (name) => {
      if (get().preview) {
        const folders = [...get().folders, { path: name, name, flags: [], specialUse: null, total: 0 }];
        set({ folders });
        const pv = get().pv;
        if (pv) {
          pv.folders = folders;
          if (!pv.lists[name]) pv.lists[name] = [];
        }
        toast.success(`Created folder ${name}`);
        return;
      }
      try {
        await mailApi.createFolder(name);
        toast.success(`Created folder ${name}`);
        get().loadFolders();
      } catch {
        toast.error("Could not create folder");
      }
    },

    renameFolder: async (path, newName) => {
      if (get().preview) {
        set({
          folders: get().folders.map((f) => (f.path === path ? { ...f, path: newName, name: newName } : f)),
        });
        const pv = get().pv;
        if (pv) {
          pv.folders = get().folders;
          const existing = pv.lists[path];
          if (existing) {
            pv.lists[newName] = existing;
            delete pv.lists[path];
          }
        }
        toast.success(`Renamed to ${newName}`);
        return;
      }
      try {
        await mailApi.renameFolder(path, newName);
        toast.success(`Renamed to ${newName}`);
        get().loadFolders();
      } catch {
        toast.error("Could not rename folder");
      }
    },

    deleteFolder: async (path) => {
      if (get().preview) {
        set({ folders: get().folders.filter((f) => f.path !== path) });
        const pv = get().pv;
        if (pv) {
          pv.folders = get().folders;
          delete pv.lists[path];
        }
        if (get().activeFolder === path) get().setActiveFolder("INBOX");
        toast.success(`Deleted folder`);
        return;
      }
      try {
        await mailApi.deleteFolder(path);
        toast.success("Deleted folder");
        if (get().activeFolder === path) get().setActiveFolder("INBOX");
        get().loadFolders();
      } catch {
        toast.error("Could not delete folder");
      }
    },

    /* ── compose ─────────────────────────────────────────────────── */
    openCompose: (mode = "new", replyTo = null, prefill) => {
      const ownEmail = get().email;
      let draftTo: string[] = prefill?.draftTo || [];
      let draftCc: string[] = prefill?.draftCc || [];
      let draftSubject = prefill?.draftSubject || "";
      let draftBody = prefill?.draftBody || "";

      if (replyTo && mode !== "new") {
        const fromAddrs = (replyTo.from || []).map((x) => x.address).filter(Boolean);
        const ccAddrs = (replyTo.cc || []).map((x) => x.address).filter(Boolean);
        const toMe = (replyTo.to || []).some((x) => x.address === ownEmail);

        if (mode === "reply") {
          draftTo = [fromAddrs[0] || ""].filter(Boolean);
        } else if (mode === "reply-all") {
          const others = [
            ...fromAddrs,
            ...(toMe ? ccAddrs : replyTo.to?.map((x) => x.address) || []),
          ].filter((a) => a && a !== ownEmail);
          draftTo = others.length ? others : fromAddrs;
          if (toMe) {
            draftCc = ccAddrs.filter((a) => a !== ownEmail);
          }
        } else if (mode === "forward") {
          draftTo = [];
        }

        if (!draftSubject) {
          const prefix = mode === "forward" ? "Fwd" : "Re";
          draftSubject = replyTo.subject?.startsWith(prefix)
            ? replyTo.subject
            : `${prefix}: ${replyTo.subject || ""}`;
        }

        const wrote = (replyTo.from || [])
          .map((x) => x.name || x.address)
          .filter(Boolean)
          .join(", ");

        if (!draftBody) {
          const quote = `\n\n\n----\nOn ${new Date(replyTo.date).toLocaleString()}, ${wrote} wrote:\n${(replyTo.text || "").slice(0, 3000)}`;
          draftBody = mode === "forward"
            ? `\n\n---------- Forwarded message ----------\nFrom: ${wrote}\nDate: ${new Date(replyTo.date).toLocaleString()}\nSubject: ${replyTo.subject}\n\n${(replyTo.text || "").slice(0, 3000)}`
            : quote;
        }
      }

      set({
        compose: {
          open: true,
          mode,
          replyTo,
          draftTo,
          draftCc,
          draftBcc: prefill?.draftBcc || [],
          draftSubject,
          draftBody,
          draftFiles: prefill?.draftFiles || [],
          editingUid: prefill?.editingUid,
        },
      });
    },

    closeCompose: () => {
      set({ compose: { ...get().compose, open: false } });
    },

    setCompose: (patch) => {
      set({ compose: { ...get().compose, ...patch } });
    },

    saveDraft: async (silent = true) => {
      const c = get().compose;
      const payload: DraftPayload & { uid?: number; folder?: string } = {
        to: c.draftTo,
        cc: c.draftCc,
        bcc: c.draftBcc,
        subject: c.draftSubject,
        text: c.draftBody,
        html: c.draftBody.replace(/\n/g, "<br/>"),
        attachments: c.draftFiles,
      };
      if (c.editingUid) {
        payload.uid = c.editingUid;
        payload.folder = "\\Drafts";
      }
      if (get().preview) {
        const pv = get().pv;
        const list = [...(pv?.lists["\\Drafts"] || [])];
        if (!c.editingUid) {
          const uid = 3000 + list.length + 1;
          list.unshift({
            uid, seq: list.length + 1, flags: ["\\Draft"], seen: true,
            date: new Date().toISOString(),
            subject: c.draftSubject || "(no subject)",
            from: [{ name: "You", address: get().email }],
            to: c.draftTo.map((a) => ({ address: a })),
          });
          set({ compose: { ...get().compose, editingUid: uid } });
        }
        if (pv) {
          pv.lists["\\Drafts"] = list;
          pv.folders = pv.folders.map((f) =>
            f.path === "\\Drafts" ? { ...f, total: list.length } : f
          );
        }
        if (!silent) toast.success("Draft saved");
        return;
      }
      try {
        const data = await mailApi.saveDraft(payload);
        set({ compose: { ...get().compose, editingUid: data.uid } });
        if (!silent) toast.success("Draft saved");
      } catch {
        if (!silent) toast.error("Could not save draft");
      }
    },

    send: async () => {
      const c = get().compose;
      if (!c.draftTo.length) {
        toast.error("Recipient is required");
        return;
      }
      const input: DraftPayload & { draftUid?: number; draftFolder?: string } = {
        to: c.draftTo,
        cc: c.draftCc,
        bcc: c.draftBcc,
        subject: c.draftSubject,
        text: c.draftBody,
        html: c.draftBody.replace(/\n/g, "<br/>"),
        attachments: c.draftFiles,
      };
      if (c.editingUid) {
        input.draftUid = c.editingUid;
        input.draftFolder = "\\Drafts";
      }
      if (get().preview) {
        const pv = get().pv;
        const sent = pv?.lists["\\Sent"] || [];
        const uid = 2000 + sent.length + 1;
        sent.unshift({
          uid, seq: sent.length + 1, flags: [], seen: true,
          date: new Date().toISOString(),
          subject: c.draftSubject || "(no subject)",
          from: [{ name: "You", address: get().email }],
          to: c.draftTo.map((a) => ({ address: a })),
        });
        if (pv) {
          pv.lists["\\Sent"] = sent;
          pv.lists["\\Drafts"] = (pv.lists["\\Drafts"] || []).filter((m) => m.uid !== c.editingUid);
        }
        toast.success("Email sent (preview)");
        set({ compose: { open: false, mode: "new", replyTo: null, draftTo: [], draftCc: [], draftBcc: [], draftSubject: "", draftBody: "", draftFiles: [] } });
        get().loadFolders();
        get().loadMessages(get().activeFolder, get().page, true);
        return;
      }
      try {
        await mailApi.send(input);
        toast.success("Email sent");
        set({ compose: { open: false, mode: "new", replyTo: null, draftTo: [], draftCc: [], draftBcc: [], draftSubject: "", draftBody: "", draftFiles: [] } });
        get().loadFolders();
        get().loadMessages(get().activeFolder, get().page, true);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to send email");
      }
    },

    /* ── contacts ────────────────────────────────────────────────── */
    addContact: (c) => {
      const contacts = [...get().contacts, { ...c, id: `c${Date.now()}` }];
      set({ contacts });
      persistContacts();
      toast.success("Contact added");
    },
    updateContact: (c) => {
      set({ contacts: get().contacts.map((x) => (x.id === c.id ? c : x)) });
      persistContacts();
      toast.success("Contact updated");
    },
    deleteContact: (id) => {
      set({ contacts: get().contacts.filter((x) => x.id !== id) });
      persistContacts();
      toast.success("Contact deleted");
    },

    updateSettings: (s) => {
      const settings = { ...get().settings, ...s };
      set({ settings });
      persistSettings();
    },

    setCtx: (ctx) => set({ ctx }),
  };
});

/* ── helpers ──────────────────────────────────────────────────────────── */

function addrText(a: MailAddress[]) {
  return (a || []).map((x) => x.name || x.address).join(", ");
}

function setSeenLocal(uid: number, folder: string, seen: boolean) {
  const s = mailStore.getState();
  mailStore.setState({
    list: s.list.map((x) => (x.uid === uid ? { ...x, seen } : x)),
    message: s.message && s.message.uid === uid ? { ...s.message, seen } : s.message,
    selected: s.selected && s.selected.uid === uid ? { ...s.selected, seen } : s.selected,
  });
}

function toggleFlagLocal(uid: number, folder: string, flagged: boolean) {
  const s = mailStore.getState();
  const has = (flags: string[]) => (flagged ? [...new Set([...flags, "\\Flagged"])] : flags.filter((f) => f !== "\\Flagged"));
  mailStore.setState({
    list: s.list.map((x) => (x.uid === uid ? { ...x, flags: has(x.flags) } : x)),
    selected: s.selected && s.selected.uid === uid ? { ...s.selected, flags: has(s.selected.flags) } : s.selected,
  });
}

function moveLocal(st: ReturnType<typeof mailStore.getState>, uid: number, fromFolder: string, toFolder: string) {
  const pv = st.pv;
  if (!pv) return;
  const env = (pv.lists[fromFolder] || []).find((m) => m.uid === uid);
  if (!env) return;
  pv.lists[fromFolder] = (pv.lists[fromFolder] || []).filter((m) => m.uid !== uid);
  const targetList = pv.lists[toFolder] || [];
  if (toFolder !== fromFolder && !targetList.some((m) => m.uid === uid)) {
    targetList.unshift({ ...env, folder: toFolder });
    pv.lists[toFolder] = targetList;
  }
  pv.folders = pv.folders.map((f) => {
    if (f.path === fromFolder) return { ...f, total: Math.max(0, (f.total || 0) - 1) };
    if (f.path === toFolder) return { ...f, total: (f.total || 0) + 1 };
    return f;
  });
  const cur = mailStore.getState();
  if (cur.selected?.uid === uid) mailStore.setState({ selected: null, message: null });
  if (cur.activeFolder === fromFolder) cur.loadMessages(cur.activeFolder, cur.page, true);
}
