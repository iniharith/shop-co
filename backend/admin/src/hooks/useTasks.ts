import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { getTasks, createTask, updateTask, deleteTask, addTaskComment, deleteTaskComment } from "@/api/tasks";

export const useTasks = (filters?: any) => {
    const { data: session } = useSession();
    return useQueryData(['tasks', filters], () => getTasks(session?.user?.token, filters), { refetchInterval: 3000 });
}

export const useCreateTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createTask'], (data: any) => createTask(session?.user?.token, data), ['tasks']);
    return { mutate, isPending };
}

export const useUpdateTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateTask'], ({ id, data }: any) => updateTask(session?.user?.token, id, data), ['tasks']);
    return { mutate, isPending };
}

export const useDeleteTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteTask'], (id: string) => deleteTask(session?.user.token, id), ["tasks", "allFiles", "groupedFiles"]);
    return { mutate, isPending };
}

export const usePermanentDeleteTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['permanentDeleteTask'], (id: string) => import("@/api/tasks").then(m => m.permanentDeleteTask(session?.user.token, id)), ["tasks", "allFiles", "groupedFiles"]);
    return { mutate, isPending };
}

export const useUploadTaskFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['uploadTaskFile'],
        (data: { id: string, file: File, tag?: string }) => import("@/api/tasks").then(m => m.uploadTaskFile(session?.user.token, data.id, data.file, data.tag)),
        ["tasks", "allFiles", "groupedFiles"]
    )
    return { mutate, isPending }
}

export const useDeleteTaskFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['deleteTaskFile'],
        (data: { id: string, fileId: string }) => import("@/api/tasks").then(m => m.deleteTaskFile(session?.user.token, data.id, data.fileId)),
        ["tasks", "allFiles", "groupedFiles"]
    )
    return { mutate, isPending }
}

export const useAddTaskComment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['addTaskComment'], ({ id, text }: any) => addTaskComment(session?.user?.token, id, text), ['tasks']);
    return { mutate, isPending };
}

export const useDeleteTaskComment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteTaskComment'], ({ id, commentId }: any) => deleteTaskComment(session?.user?.token, id, commentId), ['tasks']);
    return { mutate, isPending };
}

export const useUpdateTaskFileNotes = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['updateTaskFileNotes'],
        (data: { id: string, fileUrl: string, notes: string }) => import("@/api/tasks").then(m => m.updateTaskFileNotes(session?.user.token, data.id, data.fileUrl, data.notes)),
        ["tasks", "allFiles", "groupedFiles"]
    );
    return { mutate, isPending };
}
