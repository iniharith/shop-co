import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  createProject,
  deleteProject,
  deleteProjectFile,
  getProject,
  getProjects,
  updateProject,
  uploadProjectFile,
  createProjectFolder,
  renameProjectFolder,
  deleteProjectFolder,
  moveProjectFolders,
  updateProjectFile,
} from "@/api/projects";

export const useProjects = (q = "") => {
  const { data: session, status } = useSession();
  return useQuery({
    queryKey: ["projects", q],
    queryFn: () => getProjects(session?.user?.token || "", q),
    enabled: status === "authenticated",
  });
};

export const useProject = (id: string) => {
  const { data: session, status } = useSession();
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(session?.user?.token || "", id),
    enabled: status === "authenticated" && !!id,
  });
};

export const useCreateProject = () => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) => createProject(session?.user?.token || "", data),
    onSuccess: () => client.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = (id: string) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; description?: string; assigneeIds?: string[]; coverFileId?: string | null }) => updateProject(session?.user?.token || "", id, data),
    onSuccess: data => {
      client.setQueryData(["project", id], data);
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProject = (id: string) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deleteProject(session?.user?.token || "", id),
    onSuccess: () => {
      client.removeQueries({ queryKey: ["project", id] });
      client.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => client.invalidateQueries({ queryKey: ["project", id] }),
  });
};

export const useUploadProjectFile = (id: string) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress, folderId }: { file: File; onProgress?: (progress: number) => void; folderId?: string | null }) =>
      uploadProjectFile(session?.user?.token || "", id, file, onProgress, folderId),
    onSuccess: data => {
      client.setQueryData(["project", id], data);
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProjectFile = (id: string) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => deleteProjectFile(session?.user?.token || "", id, fileId),
    onSuccess: data => {
      client.setQueryData(["project", id], data);
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

const useProjectMutation = (id: string, mutationFn: (token: string, variables: any) => Promise<any>) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (variables: any) => mutationFn(session?.user?.token || "", variables),
    onSuccess: data => {
      client.setQueryData(["project", id], data);
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useCreateProjectFolder = (id: string) => useProjectMutation(id, (token, { name, parentFolderId }: { name: string; parentFolderId?: string | null }) => createProjectFolder(token, id, name, parentFolderId));
export const useRenameProjectFolder = (id: string) => useProjectMutation(id, (token, { folderId, name }) => renameProjectFolder(token, id, folderId, name));
export const useDeleteProjectFolder = (id: string) => useProjectMutation(id, (token, folderId: string) => deleteProjectFolder(token, id, folderId));
export const useMoveProjectFolders = (id: string) => useProjectMutation(id, (token, { folderIds, parentFolderId }: { folderIds: string[]; parentFolderId?: string | null }) => moveProjectFolders(token, id, folderIds, parentFolderId));
export const useUpdateProjectFile = (id: string) => useProjectMutation(id, (token, { fileId, data }) => updateProjectFile(token, id, fileId, data));
