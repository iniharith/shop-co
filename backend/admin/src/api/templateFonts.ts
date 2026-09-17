import AxiosInstance from "@/utils/axios";

export type TemplateFont = {
  _id: string;
  name: string;
  family: string;
  url: string;
};

export const getTemplateFonts = async (token: string) => {
  const response = await AxiosInstance(token).get<{ data: TemplateFont[] }>("/api/template-fonts");
  return response.data.data;
};

export const uploadTemplateFont = async (token: string, file: File, family: string) => {
  const body = new FormData();
  body.append("font", file);
  body.append("family", family);
  const response = await AxiosInstance(token).post<{ data: TemplateFont }>("/api/template-fonts", body, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data.data;
};

export const deleteTemplateFont = async (token: string, id: string) => {
  await AxiosInstance(token).delete(`/api/template-fonts/${id}`);
};

export type DiyTemplate = {
  id: string;
  name: string;
  kind: "photo-canvas" | "photobook-cover";
  width: number;
  height: number;
  size?: string;
  sourceFile?: string;
  preview?: string;
  svg?: string;
  slots: Array<{ id: string; label: string; x: number; y: number; width: number; height: number; rotation?: number; radius?: number }>;
  [key: string]: unknown;
};

export const getDiyTemplates = async (token: string) => {
  try {
    const response = await AxiosInstance(token).get<{ templates: DiyTemplate[] }>("/api/diy-templates", { timeout: 30000 });
    if (Array.isArray(response.data.templates) && response.data.templates.length) return response.data.templates;
  } catch {
    // The public DIY source below keeps the admin library usable while the backend deploys.
  }
  const sources = [
    "https://diy.kampungcetak.com/api/diy-template-library",
    "https://raw.githubusercontent.com/iniharith/shop-co/main/frontend/public/templates/photo-canvas/library/manifest.json",
  ];
  for (const source of sources) {
    try {
      const fallback = await fetch(source, { cache: "no-store" });
      if (!fallback.ok) continue;
      const payload = await fallback.json() as { templates?: DiyTemplate[] } | DiyTemplate[];
      const templates = Array.isArray(payload) ? payload : payload.templates;
      if (Array.isArray(templates) && templates.length) return templates.map((template) => ({ ...template, kind: template.kind || "photo-canvas" }));
    } catch {
      // Try the next canonical DIY source.
    }
  }
  throw new Error("Could not load the DIY template library.");
};

export const updateDiyTemplate = async (token: string, template: DiyTemplate) => {
  await AxiosInstance(token).put(`/api/diy-templates/${encodeURIComponent(template.id)}`, { template });
};
