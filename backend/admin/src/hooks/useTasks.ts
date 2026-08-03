/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, getTask, createTask, updateTask, deleteTask, restoreTask, addTaskComment, deleteTaskComment } from "@/api/tasks";
import { findTaskCacheLocations, findTaskInCaches, removeTaskFromCaches, restoreTaskToCaches, rollbackTaskFields, updateTaskCaches } from "@/utils/taskCache";
import { toast } from "sonner";

export const useTasks = (filters?: any, enabled = true) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['tasks', filters],
        () => getTasks(session?.user?.token, filters),
        { enabled: enabled && status === "authenticated", staleTime: 30_000 }
    );
}

export const useInfiniteTasks = (filters?: Record<string, string | number | undefined>, enabled = true) => {
    const { data: session, status } = useSession();
    return useInfiniteQuery({
        queryKey: ['tasks', 'infinite', filters],
        queryFn: ({ pageParam }) => getTasks(session?.user?.token, { ...filters, cursor: pageParam || undefined }),
        initialPageParam: null as string | null,
        getNextPageParam: page => page.pageInfo.nextCursor || undefined,
        enabled: enabled && status === "authenticated",
        staleTime: 30_000,
    });
}

export const useTask = (id: string | undefined) => {
    const { data: session, status } = useSession();
    // staleTime: 30s so reopening the same task feels instant (uses cache).
    // Socket events via socketProvider will invalidate and refresh when a
    // teammate makes a change, keeping the modal up-to-date in real-time.
    return useQueryData(['task', id], () => getTask(session?.user?.token, id!), {
        enabled: status === "authenticated" && !!id,
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

    type UpdateVariables = { id: string; data: Record<string, any>; skipUndo?: boolean; silent?: boolean };
    const mutation = useMutation<any, Error, UpdateVariables, any>({
        mutationKey: ['updateTask'],
        mutationFn: ({ id, data }) => updateTask(session?.user?.token, id, data),
        onMutate: async ({ id, data }) => {
            await client.cancelQueries({ queryKey: ['tasks'] });
            const previousTask = findTaskInCaches(client, id);
            const optimistic = { ...data };
            const isNewAssignment = data.assignee && previousTask?.assignee !== data.assignee;
            if (isNewAssignment && ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED'].includes(previousTask?.status) && !data.status) {
                optimistic.status = 'IN_DESIGN';
            }
            updateTaskCaches(client, { _id: id, ...optimistic });
            return {
                previousTask,
                optimistic,
                previous: Object.fromEntries(Object.keys(optimistic).map(key => [key, previousTask?.[key]])),
            };
        },
        onError: (err, variables, context) => {
            if (context?.previous) rollbackTaskFields(client, variables.id, context.optimistic, context.previous);
            if (!variables.silent) toast.error("Failed to update task", { description: err.message });
        },
        onSuccess: (data, variables, context) => {
            updateTaskCaches(client, data?.task);
            const changesStatus = variables.data.status !== undefined;
            const changesAssignee = variables.data.assignee !== undefined;
            if (!variables.silent && !variables.skipUndo && (changesStatus || changesAssignee)) {
                const canUndo = Boolean(context?.previousTask) && (!changesStatus || variables.data.status !== 'DELIVERED');
                toast.success(changesAssignee ? "Assignment updated" : "Status updated", canUndo ? {
                    duration: 5000,
                    action: {
                        label: "Undo",
                        onClick: () => {
                            const current = findTaskInCaches(client, variables.id);
                            const applied = data?.task || context?.optimistic;
                            const stillCurrent = changesAssignee
                                ? current?.assignee === applied?.assignee && current?.status === applied?.status
                                : current?.status === applied?.status;
                            if (!stillCurrent) {
                                toast.info("Task changed again; Undo is no longer available");
                                return;
                            }
                            mutation.mutate({
                                id: variables.id,
                                data: changesAssignee
                                    ? { assignee: context?.previousTask?.assignee || null, status: context?.previousTask?.status }
                                    : { status: context?.previousTask?.status },
                                skipUndo: true,
                            });
                        },
                    },
                } : undefined);
            }
        },
        onSettled: (data, error, variables) => {
            client.invalidateQueries({ queryKey: ['tasks'] });
            client.invalidateQueries({ queryKey: ['orders'] });
            client.invalidateQueries({ queryKey: ['folderGroup'] });
            if (variables?.id) {
                client.invalidateQueries({ queryKey: ['task', variables.id] });
            }
        },
    });
    
    return { mutate: mutation.mutate, mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}

export const useDeleteTask = () => {
    const { data: session } = useSession();
    const client = useQueryClient();
    const restoreMutation = useMutation({
        mutationKey: ['restoreTask'],
        mutationFn: ({ id }: { id: string }) => restoreTask(session?.user?.token, id),
        onSuccess: data => {
            updateTaskCaches(client, data?.task);
            if (data?.task?._id) client.setQueryData(['task', data.task._id], { success: true, task: data.task });
        },
        onError: (_error, { id }) => removeTaskFromCaches(client, id),
        onSettled: () => client.invalidateQueries({ queryKey: ['tasks'] }),
    });
    const mutation = useMutation({
        mutationKey: ['deleteTask'],
        mutationFn: (id: string) => deleteTask(session?.user?.token, id),
        onMutate: async id => {
            await client.cancelQueries({ queryKey: ['tasks'] });
            const task = findTaskInCaches(client, id);
            const locations = findTaskCacheLocations(client, id);
            removeTaskFromCaches(client, id);
            return { task, locations };
        },
        onError: (error: Error, _id, context) => {
            if (context?.task) restoreTaskToCaches(client, context.task, context.locations);
            toast.error("Failed to delete task", { description: error.message });
        },
        onSuccess: (_data, id, context) => toast.success("Task deleted", {
            duration: 5000,
            action: {
                label: "Undo",
                onClick: () => {
                    if (context?.task) restoreTaskToCaches(client, { ...context.task, isDeleted: false }, context.locations);
                    restoreMutation.mutate({ id });
                },
            },
        }),
        onSettled: () => ["tasks", "allFiles", "groupedFiles"].forEach(key => client.invalidateQueries({ queryKey: [key] })),
    });
    return { mutate: mutation.mutate, isPending: mutation.isPending };
}

export const usePermanentDeleteTask = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['permanentDeleteTask'], (id: string) => import("@/api/tasks").then(m => m.permanentDeleteTask(session?.user?.token, id)), ["tasks", "allFiles", "groupedFiles"]);
    return { mutate, isPending };
}

export const useUploadTaskFile = () => {
    const { data: session } = useSession();
    const client = useQueryClient();
    const { mutate, mutateAsync, isPending } = useMutation({
        mutationKey: ['uploadTaskFile'],
        mutationFn: (data: { id: string, file: File, tag?: string, onProgress?: (percent: number) => void, abortController?: AbortController }) =>
            import("@/api/tasks").then(m => m.uploadTaskFile(session?.user?.token, data.id, data.file, data.tag, data.onProgress, data.abortController)),
        onMutate: async ({ id }) => {
            await client.cancelQueries({ queryKey: ["task", id] });
        },
        onSuccess: (data) => {
            updateTaskCaches(client, data?.task);
            ["allFiles", "groupedFiles", "fileIndex", "filesByFolder"].forEach((key) => {
                void client.invalidateQueries({ queryKey: [key], refetchType: "active" });
            });
        },
        onError: (error: Error, { id }) => {
            void client.invalidateQueries({ queryKey: ["task", id], refetchType: "active" });
            import("sonner").then(m => m.toast.error("Failed to upload file", { description: error.message }));
        },
    });
    return { mutate, mutateAsync, isPending };
}

export const useDeleteTaskFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['deleteTaskFile'],
        (data: { id: string, fileId: string }) => import("@/api/tasks").then(m => m.deleteTaskFile(session?.user?.token, data.id, data.fileId)),
        ["tasks", "allFiles", "groupedFiles", "fileIndex", "filesByFolder", "task"]
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
        ["tasks", "allFiles", "groupedFiles", "fileIndex", "filesByFolder"]
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
