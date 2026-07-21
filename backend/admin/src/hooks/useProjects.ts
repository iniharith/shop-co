import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  createProject,
  deleteProjectFile,
  getProject,
  getProjects,
  updateProject,
  uploadProjectFile,
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
    mutationFn: (data: { title?: string; description?: string }) => updateProject(session?.user?.token || "", id, data),
    onSuccess: data => {
      client.setQueryData(["project", id], data);
      client.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUploadProjectFile = (id: string) => {
  const { data: session } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) =>
      uploadProjectFile(session?.user?.token || "", id, file, onProgress),
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
