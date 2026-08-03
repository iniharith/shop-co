import { QueryClient, QueryKey } from "@tanstack/react-query";

const mapTaskResponse = (old: any, transform: (tasks: any[]) => any[]) => {
  if (Array.isArray(old?.pages)) {
    return { ...old, pages: old.pages.map((page: any) => page?.tasks ? { ...page, tasks: transform(page.tasks) } : page) };
  }
  if (Array.isArray(old?.tasks)) return { ...old, tasks: transform(old.tasks) };
  return old;
};

const isOlderTask = (incoming: any, current: any) => {
  if (!incoming?.updatedAt || !current?.updatedAt) return false;
  return new Date(incoming.updatedAt).getTime() < new Date(current.updatedAt).getTime();
};

export const updateTaskCaches = (client: QueryClient, task: any) => {
  if (!task?._id) return;

  client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
    return mapTaskResponse(old, tasks => {
      const existingTask = tasks.find((item: any) => item._id === task._id);
      if (!existingTask || isOlderTask(task, existingTask)) return tasks;
      return tasks.map((item: any) => item._id === task._id ? { ...item, ...task } : item);
    });
  });

  client.setQueryData(["task", task._id], (old: any) => {
    if (!old) return old;
    if (old?.task && isOlderTask(task, old.task)) return old;
    return { ...old, success: true, task: { ...(old.task || {}), ...task } };
  });
};

export const removeTaskFromCaches = (client: QueryClient, taskId: string) => {
  client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
    return mapTaskResponse(old, tasks => tasks.filter((task: any) => task._id !== taskId));
  });
  client.removeQueries({ queryKey: ["task", taskId], exact: true });
};

export const findTaskInCaches = (client: QueryClient, taskId: string) => {
  for (const [, data] of client.getQueriesData({ queryKey: ["tasks"] })) {
    const pages = Array.isArray((data as any)?.pages) ? (data as any).pages : [data];
    for (const page of pages) {
      const task = page?.tasks?.find((item: any) => item._id === taskId);
      if (task) return task;
    }
  }
  return (client.getQueryData(["task", taskId]) as any)?.task;
};

export const findTaskCacheLocations = (client: QueryClient, taskId: string): QueryKey[] => {
  return client.getQueriesData({ queryKey: ["tasks"] })
    .filter(([, data]) => {
      const pages = Array.isArray((data as any)?.pages) ? (data as any).pages : [data];
      return pages.some(page => page?.tasks?.some((item: any) => item._id === taskId));
    })
    .map(([queryKey]) => queryKey);
};

export const restoreTaskToCaches = (client: QueryClient, task: any, queryKeys?: QueryKey[]) => {
  if (!task?._id) return;
  const restore = (old: any) => {
    if (Array.isArray(old?.pages)) {
      const exists = old.pages.some((page: any) => page?.tasks?.some((item: any) => item._id === task._id));
      if (exists || !old.pages[0]?.tasks) return old;
      return { ...old, pages: [{ ...old.pages[0], tasks: [task, ...old.pages[0].tasks] }, ...old.pages.slice(1)] };
    }
    if (!Array.isArray(old?.tasks) || old.tasks.some((item: any) => item._id === task._id)) return old;
    return { ...old, tasks: [task, ...old.tasks] };
  };
  if (queryKeys) queryKeys.forEach(queryKey => client.setQueryData(queryKey, restore));
  else client.setQueriesData({ queryKey: ["tasks"] }, restore);
};

export const rollbackTaskFields = (client: QueryClient, taskId: string, optimistic: Record<string, any>, previous: Record<string, any>) => {
  const rollback = (task: any) => {
    if (task?._id !== taskId) return task;
    const stillMatches = Object.entries(optimistic).every(([key, value]) => task[key] === value);
    return stillMatches ? { ...task, ...previous } : task;
  };
  client.setQueriesData({ queryKey: ["tasks"] }, (old: any) => mapTaskResponse(old, tasks => tasks.map(rollback)));
  client.setQueryData(["task", taskId], (old: any) => old?.task ? { ...old, task: rollback(old.task) } : old);
};
