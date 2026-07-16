/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, getTask, createTask, updateTask, deleteTask, addTaskComment, deleteTaskComment } from "@/api/tasks";

export const useTasks = (filters?: any) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['tasks', filters],
        () => getTasks(session?.user?.token, filters),
        { enabled: status !== "loading" }
    );
}

export const useTask = (id: string | undefined) => {
    const { data: session } = useSession();
    // staleTime: 30s so reopening the same task feels instant (uses cache).
    // Socket events via socketProvider will invalidate and refresh when a
    // teammate makes a change, keeping the modal up-to-date in real-time.
    return useQueryData(['task', id], () => getTask(session?.user?.token, id!), {
        enabled: !!id,
        staleTime: 30000,
    });
}

export const useCreateTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createTask'], (data: any) => createTask(session?.user?.token, data), ['tasks']);
    return { mutate, isPending };
}

export const useUpdateTask = () => {
    const { data: session } = useSession();
    const client = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationKey: ['updateTask'],
        mutationFn: ({ id, data }: any) => updateTask(session?.user?.token, id, data),
        onMutate: async ({ id, data }) => {
            await client.cancelQueries({ queryKey: ['tasks'] });
            
            const previousTasks = client.getQueriesData({ queryKey: ['tasks'] });
            
            client.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
                if (!old) return old;
                if (old.tasks) {
                    return {
                        ...old,
                        tasks: old.tasks.map((task: any) => {
                            if (task._id === id) {
                                return { ...task, ...data };
                            }
                            return task;
                        })
                    };
                }
                return old;
            });
            
            return { previousTasks };
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousTasks) {
                context.previousTasks.forEach(([queryKey, data]: any) => {
                    client.setQueryData(queryKey, data);
                });
            }
            import("sonner").then(m => m.toast.error("Failed to update task", { description: err.message }));
        },
        onSettled: (data, error, variables) => {
            client.invalidateQueries({ queryKey: ['tasks'] });
            if (variables?.id) {
                client.invalidateQueries({ queryKey: ['task', variables.id] });
            }
        },
    });
    
    return { mutate, isPending };
}

export const useDeleteTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteTask'], (id: string) => deleteTask(session?.user?.token, id), ["tasks", "allFiles", "groupedFiles"]);
    return { mutate, isPending };
}

export const usePermanentDeleteTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['permanentDeleteTask'], (id: string) => import("@/api/tasks").then(m => m.permanentDeleteTask(session?.user?.token, id)), ["tasks", "allFiles", "groupedFiles"]);
    return { mutate, isPending };
}

export const useUploadTaskFile = () => {
    const { data: session } = useSession();
    const { mutate, mutateAsync, isPending } = useMutationData(
        ['uploadTaskFile'],
        (data: { id: string, file: File, tag?: string, onProgress?: (percent: number) => void, abortController?: AbortController }) => 
            import("@/api/tasks").then(m => m.uploadTaskFile(session?.user?.token, data.id, data.file, data.tag, data.onProgress, data.abortController)),
        ["tasks", "allFiles", "groupedFiles", "task"]
    )
    return { mutate, mutateAsync, isPending }
}

export const useDeleteTaskFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['deleteTaskFile'],
        (data: { id: string, fileId: string }) => import("@/api/tasks").then(m => m.deleteTaskFile(session?.user?.token, data.id, data.fileId)),
        ["tasks", "allFiles", "groupedFiles", "task"]
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
    const client = useQueryClient();
    
    const { mutate, isPending } = useMutation({
        mutationKey: ['deleteTaskComment'],
        mutationFn: ({ id, commentId }: any) => 
            import("@/api/tasks").then(m => m.deleteTaskComment(session?.user?.token, id, commentId)),
        onMutate: async ({ id, commentId }) => {
            await client.cancelQueries({ queryKey: ['tasks'] });
            
            const previousTasks = client.getQueriesData({ queryKey: ['tasks'] });
            
            client.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
                if (!old) return old;
                if (old.tasks) {
                    return {
                        ...old,
                        tasks: old.tasks.map((task: any) => {
                            if (task._id === id) {
                                return {
                                    ...task,
                                    comments: task.comments?.filter((c: any) => c._id !== commentId)
                                };
                            }
                            return task;
                        })
                    };
                }
                return old;
            });
            
            return { previousTasks };
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousTasks) {
                context.previousTasks.forEach(([queryKey, data]: any) => {
                    client.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            client.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
    
    return { mutate, isPending };
}

export const useUpdateTaskFileNotes = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['updateTaskFileNotes'],
        (data: { id: string, fileUrl: string, notes: string }) => import("@/api/tasks").then(m => m.updateTaskFileNotes(session?.user?.token, data.id, data.fileUrl, data.notes)),
        ["tasks", "allFiles", "groupedFiles"]
    );
    return { mutate, isPending };
}

export const usePinTaskComment = () => {
    const { data: session } = useSession();
    const client = useQueryClient();
    
    const { mutate, isPending } = useMutation({
        mutationKey: ['pinTaskComment'],
        mutationFn: ({ id, commentId, pinned }: any) => 
            import("@/api/tasks").then(m => m.pinTaskComment(session?.user?.token, id, commentId, pinned)),
        onMutate: async ({ id, commentId, pinned }) => {
            await client.cancelQueries({ queryKey: ['tasks'] });
            
            const previousTasks = client.getQueriesData({ queryKey: ['tasks'] });
            
            client.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
                if (!old) return old;
                if (old.tasks) {
                    return {
                        ...old,
                        tasks: old.tasks.map((task: any) => {
                            if (task._id === id) {
                                return {
                                    ...task,
                                    comments: task.comments?.map((c: any) => 
                                        c._id === commentId ? { ...c, pinned } : c
                                    )
                                };
                            }
                            return task;
                        })
                    };
                }
                return old;
            });
            
            return { previousTasks };
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousTasks) {
                context.previousTasks.forEach(([queryKey, data]: any) => {
                    client.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            client.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
    
    return { mutate, isPending };
}
