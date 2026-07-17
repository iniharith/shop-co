import { QueryClient } from "@tanstack/react-query";

const isOlderTask = (incoming: any, current: any) => {
  if (!incoming?.updatedAt || !current?.updatedAt) return false;
  return new Date(incoming.updatedAt).getTime() < new Date(current.updatedAt).getTime();
};

export const updateTaskCaches = (client: QueryClient, task: any) => {
  if (!task?._id) return;

  client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
    if (!old?.tasks) return old;

    const existingTask = old.tasks.find((item: any) => item._id === task._id);
    if (!existingTask || isOlderTask(task, existingTask)) return old;

    return {
      ...old,
      tasks: old.tasks.map((item: any) =>
        item._id === task._id ? { ...item, ...task } : item
      ),
    };
  });

  client.setQueryData(["task", task._id], (old: any) => {
    if (!old) return { success: true, task };
    if (old?.task && isOlderTask(task, old.task)) return old;
    return { ...old, success: true, task: { ...(old.task || {}), ...task } };
  });
};

export const removeTaskFromCaches = (client: QueryClient, taskId: string) => {
  client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
    if (!old?.tasks) return old;
    return { ...old, tasks: old.tasks.filter((task: any) => task._id !== taskId) };
  });
  client.removeQueries({ queryKey: ["task", taskId], exact: true });
};
