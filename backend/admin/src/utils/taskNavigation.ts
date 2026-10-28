import { isTaskId } from './taskId';

export function taskIdFromSearch(params: Pick<URLSearchParams, 'get'>): string | undefined {
  const id = params.get('taskId') || params.get('task');
  return isTaskId(id) ? id.toLowerCase() : undefined;
}

export function taskUrlForSelection(currentUrl: string, taskId?: string): string {
  const url = new URL(currentUrl);
  url.searchParams.delete('taskId');
  url.searchParams.delete('task');
  if (isTaskId(taskId)) url.searchParams.set('taskId', taskId.toLowerCase());
  return `${url.pathname}${url.search}${url.hash}`;
}

export function shouldOpenLinkedTask(currentUrl: string, requestedId: string | undefined, responseTask: any, openedId: string | null): boolean {
  const actualId = taskIdFromSearch(new URL(currentUrl).searchParams);
  return Boolean(requestedId && requestedId === actualId && responseTask?._id?.toLowerCase?.() === requestedId && openedId !== requestedId);
}
