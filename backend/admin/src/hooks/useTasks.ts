import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { getTasks, createTask, updateTask, deleteTask, addTaskComment } from "@/api/tasks";

export const useTasks = (filters?: any) => {
    const { data: session } = useSession();
    return useQueryData(['tasks', filters], () => getTasks(session?.user?.token, filters));
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
    const { mutate, isPending } = useMutationData(['deleteTask'], (id: string) => deleteTask(session?.user?.token, id), ['tasks']);
    return { mutate, isPending };
}

export const useAddTaskComment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['addTaskComment'], ({ id, text }: any) => addTaskComment(session?.user?.token, id, text), ['tasks']);
    return { mutate, isPending };
}
