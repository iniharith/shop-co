/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios from "axios";

export const MAIL_TOKEN_KEY = "kc_mail_token";
export const MAIL_EMAIL_KEY = "kc_mail_email";
export const MAIL_PREVIEW_KEY = "kc_mail_preview";

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

  async messages(folder: string, page = 1, pageSize = 50): Promise<MailList> {
    const res = await client().get("/messages", {
      params: { folder, page, pageSize },
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

  async send(input: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    text: string;
    html?: string;
    attachments?: { filename: string; base64: string; contentType: string }[];
  }) {
    const res = await client().post("/send", input);
    return res.data;
  },
};
