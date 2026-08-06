/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios from "axios";

export const MAIL_TOKEN_KEY = "kc_mail_token";
export const MAIL_EMAIL_KEY = "kc_mail_email";
export const MAIL_PREVIEW_KEY = "kc_mail_preview";
export const MAIL_CONTACTS_KEY = "kc_mail_contacts";
export const MAIL_SETTINGS_KEY = "kc_mail_settings";
export const MAIL_SNOOZE_KEY = "kc_mail_snooze";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type MailAddress = { name?: string; address: string };
export type MailFolder = {
  path: string;
  name: string;
  flags: string[];
  specialUse: string | null;
  total: number;
};
export type MailEnvelope = {
  uid: number;
  seq: number;
  flags: string[];
  seen: boolean;
  date: string | null;
  subject: string;
  from: MailAddress[];
  to: MailAddress[];
  attachments?: number;
  folder?: string;
};
export type MailAttachment = {
  part: string;
  filename: string;
  contentType: string;
  size: number;
  contentId: string | null;
  dataUri?: string | null;
};
export type MailMessage = {
  uid: number;
  folder: string;
  date: string;
  subject: string;
  from: MailAddress[];
  to: MailAddress[];
  cc: MailAddress[];
  flags: string[];
  seen: boolean;
  text: string;
  html: string;
  attachments: MailAttachment[];
};
export type MailList = {
  items: MailEnvelope[];
  total: number;
  page: number;
  pageSize: number;
  folder: string;
};
export type MailContact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
};
export type MailThemeSettings = {
  bgColor: string;
  fontColor: string;
  buttonColor: string;
  pointColor: string;
};
export type MailSettings = {
  signature: string;
  theme: MailThemeSettings;
  vacation: { enabled: boolean; subject: string; body: string };
  notifications: { sound: boolean; desktop: boolean };
};
export type MailFilters = {
  from?: string;
  to?: string;
  subject?: string;
  since?: string;
  before?: string;
  hasAttachment?: boolean;
  starred?: boolean;
  unread?: boolean;
};
export type ComposeMode = "new" | "reply" | "reply-all" | "forward";
export type DraftPayload = {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; base64: string; contentType: string }[];
};

function client() {
  return axios.create({
    baseURL: `${BASE}/api/mail`,
    timeout: 60000,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MAIL_TOKEN_KEY) || "";
}

export function getMailEmail() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MAIL_EMAIL_KEY) || "";
}

export function clearMailSession() {
  localStorage.removeItem(MAIL_TOKEN_KEY);
  localStorage.removeItem(MAIL_EMAIL_KEY);
  localStorage.removeItem(MAIL_PREVIEW_KEY);
}

export function getPreviewMode() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MAIL_PREVIEW_KEY) === "1";
}

export function setPreviewMode(on: boolean) {
  if (on) {
    localStorage.setItem(MAIL_PREVIEW_KEY, "1");
  } else {
    localStorage.removeItem(MAIL_PREVIEW_KEY);
  }
}

/* ── Per-account persisted data (contacts / settings / snooze) ─────────── */

export function getContacts(): MailContact[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MAIL_CONTACTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setContacts(contacts: MailContact[]) {
  localStorage.setItem(MAIL_CONTACTS_KEY, JSON.stringify(contacts));
}

export const DEFAULT_SETTINGS: MailSettings = {
  signature: "",
  theme: { bgColor: "", fontColor: "", buttonColor: "", pointColor: "" },
  vacation: { enabled: false, subject: "", body: "" },
  notifications: { sound: false, desktop: false },
};

export function getSettings(): MailSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(MAIL_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setSettings(s: MailSettings) {
  localStorage.setItem(MAIL_SETTINGS_KEY, JSON.stringify(s));
}

export function getSnoozed(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(MAIL_SNOOZE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setSnoozed(map: Record<string, string>) {
  localStorage.setItem(MAIL_SNOOZE_KEY, JSON.stringify(map));
}

/* ── Preview data ──────────────────────────────────────────────────────── */

export const PREVIEW_FOLDERS: MailFolder[] = [
  { path: "INBOX", name: "Inbox", flags: [], specialUse: "\\Inbox", total: 8 },
  { path: "\\Flagged", name: "Starred", flags: [], specialUse: "\\Flagged", total: 2 },
  { path: "\\Sent", name: "Sent", flags: [], specialUse: "\\Sent", total: 4 },
  { path: "\\Drafts", name: "Drafts", flags: [], specialUse: "\\Drafts", total: 2 },
  { path: "Archive", name: "Archive", flags: [], specialUse: null, total: 3 },
  { path: "\\Junk", name: "Spam", flags: [], specialUse: "\\Junk", total: 2 },
  { path: "\\Trash", name: "Trash", flags: [], specialUse: "\\Trash", total: 3 },
  { path: "Projects", name: "Projects", flags: [], specialUse: null, total: 1 },
];

const now = Date.now();
const iso = (ms: number) => new Date(now - ms).toISOString();

export const PREVIEW_LIST: MailEnvelope[] = [
  {
    uid: 101, seq: 1, flags: [], seen: false, date: iso(2 * 60000),
    subject: "Your order has been shipped 🚚",
    from: [{ name: "Kampung Cetak", address: "no-reply@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }], attachments: 1,
  },
  {
    uid: 102, seq: 2, flags: [], seen: false, date: iso(55 * 60000),
    subject: "Invoice #KC-2026-0812",
    from: [{ name: "Billing", address: "billing@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }], attachments: 1,
  },
  {
    uid: 103, seq: 3, flags: ["\\Flagged"], seen: false, date: iso(3 * 3600000),
    subject: "Design preview for your custom t-shirt",
    from: [{ name: "Design Team", address: "design@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
  {
    uid: 104, seq: 4, flags: [], seen: true, date: iso(26 * 3600000),
    subject: "Re: Bulk order quotation",
    from: [{ name: "Aiman", address: "aiman@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
  {
    uid: 105, seq: 5, flags: ["\\Flagged"], seen: true, date: iso(2 * 86400000),
    subject: "Weekly sales report 📊",
    from: [{ name: "Analytics", address: "reports@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }], attachments: 1,
  },
  {
    uid: 106, seq: 6, flags: [], seen: true, date: iso(4 * 86400000),
    subject: "Welcome to Kampung Cetak Mail",
    from: [{ name: "Kampung Cetak", address: "no-reply@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
];

const previewBody = (subject: string) =>
  `Hi there,\n\nThanks for being part of Kampung Cetak.\n\nWe're writing to you about: ${subject}\n\nIf you have any questions, just hit reply.\n\nBest regards,\nThe Kampung Cetak Team`;

export const PREVIEW_MESSAGE: MailMessage = {
  uid: 101,
  folder: "INBOX",
  date: iso(2 * 60000),
  subject: "Your order has been shipped 🚚",
  from: [{ name: "Kampung Cetak", address: "no-reply@kampungcetak.com" }],
  to: [{ name: "You", address: "you@kampungcetak.com" }],
  cc: [],
  flags: [],
  seen: false,
  text: previewBody("your order #KC-2026-0812"),
  html: "",
  attachments: [
    {
      part: "1.2",
      filename: "tracking-slip.pdf",
      contentType: "application/pdf",
      size: 248000,
      contentId: null,
    },
  ],
};

export const PREVIEW_CONTACTS: MailContact[] = [
  { id: "c1", name: "Aiman Hakim", email: "aiman@kampungcetak.com", phone: "+6012-345 6789", company: "Kampung Cetak", notes: "Sales lead — bulk orders" },
  { id: "c2", name: "Design Team", email: "design@kampungcetak.com", company: "Kampung Cetak" },
  { id: "c3", name: "Billing", email: "billing@kampungcetak.com", company: "Kampung Cetak" },
  { id: "c4", name: "Analytics", email: "reports@kampungcetak.com", company: "Kampung Cetak" },
  { id: "c5", name: "Siti Nurhaliza", email: "siti@gmail.com", phone: "+6011-2233 4455", notes: "Repeat customer" },
  { id: "c6", name: "Farah Support", email: "support@kampungcetak.com", company: "Kampung Cetak" },
];

export const PREVIEW_SENT: MailEnvelope[] = [
  {
    uid: 201, seq: 1, flags: [], seen: true, date: iso(1 * 3600000),
    subject: "Re: Bulk order quotation",
    from: [{ name: "You", address: "you@kampungcetak.com" }],
    to: [{ name: "Aiman", address: "aiman@kampungcetak.com" }],
  },
  {
    uid: 202, seq: 2, flags: [], seen: true, date: iso(5 * 3600000),
    subject: "Print file for poster A3",
    from: [{ name: "You", address: "you@kampungcetak.com" }],
    to: [{ name: "Design Team", address: "design@kampungcetak.com" }],
  },
  {
    uid: 203, seq: 3, flags: [], seen: true, date: iso(2 * 86400000),
    subject: "Payment received — Invoice #KC-2026-0812",
    from: [{ name: "You", address: "you@kampungcetak.com" }],
    to: [{ name: "Billing", address: "billing@kampungcetak.com" }],
  },
];

export const PREVIEW_DRAFTS: MailEnvelope[] = [
  {
    uid: 301, seq: 1, flags: ["\\Draft"], seen: true, date: iso(30 * 60000),
    subject: "Draft: Company profile request",
    from: [{ name: "You", address: "you@kampungcetak.com" }],
    to: [{ name: "Siti Nurhaliza", address: "siti@gmail.com" }],
  },
];

export const PREVIEW_JUNK: MailEnvelope[] = [
  {
    uid: 401, seq: 1, flags: [], seen: true, date: iso(8 * 3600000),
    subject: "Congratulations, you won a prize! 🎉",
    from: [{ name: "Lucky Winner", address: "winner@spam.example.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
];

export const PREVIEW_TRASH: MailEnvelope[] = [
  {
    uid: 501, seq: 1, flags: ["\\Deleted"], seen: true, date: iso(20 * 3600000),
    subject: "Old newsletter",
    from: [{ name: "Newsletter", address: "news@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
];

export const PREVIEW_ARCHIVE: MailEnvelope[] = [
  {
    uid: 601, seq: 1, flags: [], seen: true, date: iso(6 * 86400000),
    subject: "May order summary",
    from: [{ name: "Kampung Cetak", address: "no-reply@kampungcetak.com" }],
    to: [{ name: "You", address: "you@kampungcetak.com" }],
  },
];

/* ── API client ────────────────────────────────────────────────────────── */

export const mailApi = {
  async login(email: string, password: string) {
    const res = await client().post("/login", { email, password });
    const { token } = res.data.data;
    localStorage.setItem(MAIL_TOKEN_KEY, token);
    localStorage.setItem(MAIL_EMAIL_KEY, email);
    return res.data.data;
  },

  async logout() {
    try {
      await client().post("/logout");
    } catch {
      /* ignore */
    }
    clearMailSession();
  },

  async folders(): Promise<MailFolder[]> {
    const res = await client().get("/folders");
    return res.data.data || [];
  },

  async messages(folder: string, page = 1, pageSize = 50, filters: MailFilters = {}): Promise<MailList> {
    const res = await client().get("/messages", {
      params: { folder, page, pageSize, ...filters },
    });
    return res.data.data;
  },

  async message(uid: number, folder: string): Promise<MailMessage> {
    const res = await client().get(`/messages/${uid}`, {
      params: { folder },
    });
    return res.data.data;
  },

  async setSeen(uid: number, folder: string, seen: boolean) {
    await client().patch(`/messages/${uid}`, { seen }, { params: { folder } });
  },

  async setFlagged(uid: number, folder: string, flagged: boolean) {
    await client().patch(`/messages/${uid}`, { flagged }, { params: { folder } });
  },

  async move(uid: number, folder: string, moveTo: string) {
    await client().patch(`/messages/${uid}`, { moveTo }, { params: { folder } });
  },

  async trash(uid: number, folder: string) {
    await client().delete(`/messages/${uid}`, { params: { folder } });
  },

  async createFolder(name: string) {
    await client().post("/folders", { name });
  },

  async renameFolder(path: string, newName: string) {
    await client().put("/folders", { path, newName });
  },

  async deleteFolder(path: string) {
    await client().delete("/folders", { params: { path } });
  },

  async saveDraft(payload: DraftPayload & { uid?: number; folder?: string }) {
    const res = await client().put("/drafts", payload);
    return res.data.data;
  },

  async downloadAttachment(uid: number, folder: string, part: string) {
    const res = await client().get(`/attachments/${uid}/${part}`, {
      params: { folder },
      responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(res.data);
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    return { url: blobUrl, filename: match ? match[1] : `attachment-${part}` };
  },

  async send(input: DraftPayload & { draftUid?: number; draftFolder?: string }) {
    const res = await client().post("/send", input);
    return res.data;
  },
};
