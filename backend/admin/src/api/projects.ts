import AxiosInstance from "@/utils/axios";

export interface ProjectFile {
  _id: string;
  key: string;
  url: string;
  previewUrl: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  folderId?: string;
  notes?: string;
}

export interface ProjectFolder {
  _id: string;
  name: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  files: ProjectFile[];
  folders: ProjectFolder[];
  assigneeIds: string[];
  coverFileId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export const getProjects = async (token: string, q = "") => {
  const response = await AxiosInstance(token).get("/api/projects", { params: q ? { q } : undefined });
  return response.data;
};

export const getProject = async (token: string, id: string) => {
  const response = await AxiosInstance(token).get(`/api/projects/${id}`);
  return response.data;
};

export const createProject = async (token: string, data: { title: string; description?: string }) => {
  const response = await AxiosInstance(token).post("/api/projects", data);
  return response.data;
};

export const updateProject = async (token: string, id: string, data: { title?: string; description?: string; assigneeIds?: string[]; coverFileId?: string | null }) => {
  const response = await AxiosInstance(token).patch(`/api/projects/${id}`, data);
  return response.data;
};

export const createProjectFolder = async (token: string, projectId: string, name: string) => {
  const response = await AxiosInstance(token).post(`/api/projects/${projectId}/folders`, { name });
  return response.data;
};

export const renameProjectFolder = async (token: string, projectId: string, folderId: string, name: string) => {
  const response = await AxiosInstance(token).patch(`/api/projects/${projectId}/folders/${folderId}`, { name });
  return response.data;
};

export const deleteProjectFolder = async (token: string, projectId: string, folderId: string) => {
  const response = await AxiosInstance(token).delete(`/api/projects/${projectId}/folders/${folderId}`);
  return response.data;
};

export const updateProjectFile = async (token: string, projectId: string, fileId: string, data: { originalName?: string; notes?: string; folderId?: string | null }) => {
  const response = await AxiosInstance(token).patch(`/api/projects/${projectId}/files/${fileId}`, data);
  return response.data;
};

export const uploadProjectFile = async (
  token: string,
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void,
  folderId?: string | null
) => {
  const mimetype = file.type || "application/octet-stream";
  const presign = await AxiosInstance(token).post(`/api/projects/${projectId}/upload-url`, {
    filename: file.name,
    contentType: mimetype,
    size: file.size,
  });
  const { signedUrl, key } = presign.data;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = Math.min(30 * 60 * 1000, Math.max(5 * 60 * 1000, Math.ceil(file.size / (128 * 1024) * 1000)));
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error(`S3 upload failed with status ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error while uploading file"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", mimetype);
    xhr.send(file);
  });

  const response = await AxiosInstance(token).post(`/api/projects/${projectId}/files`, {
    key,
    originalName: file.name,
    folderId: folderId || undefined,
  });
  return response.data;
};

export const deleteProjectFile = async (token: string, projectId: string, fileId: string) => {
  const response = await AxiosInstance(token).delete(`/api/projects/${projectId}/files/${fileId}`);
  return response.data;
};

export const createProjectShare = async (token: string, projectId: string) => {
  const response = await AxiosInstance(token).post(`/api/projects/${projectId}/share`);
  return response.data;
};
