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
