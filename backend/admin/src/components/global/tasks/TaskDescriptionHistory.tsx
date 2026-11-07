"use client";
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AxiosInstance from '@/utils/axios';
import { toast } from 'sonner';

const when = (value: string) => new Date(value).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' });
const kindName: Record<string, string> = { created: 'Task created', edit: 'Description changed', baseline: 'Existing description snapshot', trash: 'Snapshot before moving to Trash' };
function FullText({ label, value }: { label: string; value: string | null }) {
  return <div className="min-w-0 space-y-1"><p className="text-xs font-semibold">{label}</p><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-xs font-sans">{value || '(Empty description)'}</pre></div>;
}
export default function TaskDescriptionHistory({ taskId, enabled }: { taskId: string; enabled: boolean }) {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const history = useInfiniteQuery({ queryKey: ['task-description-history', taskId], enabled: enabled && !!token,
    initialPageParam: '', queryFn: async ({ pageParam }) => (await AxiosInstance(token).get(`/api/tasks/${taskId}/description-history`, { params: pageParam ? { before: pageParam } : {} })).data,
    getNextPageParam: page => page.nextCursor || undefined, staleTime: 0,
  });
  async function download(format: 'text' | 'json') {
    try {
      const response = await AxiosInstance(token).get(`/api/tasks/${taskId}/description-history/export`, { params: { format }, responseType: 'blob', timeout: 120000 });
      const url = URL.createObjectURL(response.data), a = document.createElement('a');
      a.href = url; a.download = `task-${taskId}-description-history.${format === 'text' ? 'txt' : 'json'}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error('Could not download description history'); }
  }
  if (history.isPending) return <p className="text-xs text-muted-foreground">Loading description history…</p>;
  if (history.isError) return <div className="space-y-2 text-xs"><p>Could not load description history.</p><Button size="sm" variant="outline" onClick={() => history.refetch()}>Retry</Button></div>;
  const first = history.data?.pages[0];
  if (!first) return null;
  const revisions = history.data.pages.flatMap(page => page.revisions);
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => download('text')}>Download full history (.txt)</Button><Button size="sm" variant="outline" onClick={() => download('json')}>Download original HTML (.json)</Button><Button size="sm" variant="ghost" onClick={() => history.refetch()}>Refresh</Button></div>
    <p className="text-xs text-muted-foreground">Full saved descriptions, with editor and Malaysia time. Text is scrollable and never shortened. Saved revisions survive task deletion.</p>
    {first.currentText !== null && <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Full current description</summary><div className="mt-3"><FullText label="Current" value={first.currentText} /></div></details>}
    {!revisions.length && <p className="text-xs text-muted-foreground">No full revisions have been saved yet. The next description edit will preserve both complete versions.</p>}
    {revisions.map((revision: any) => <details key={revision._id} className="rounded-lg border p-3">
      <summary className="cursor-pointer text-xs"><span className="font-semibold">{kindName[revision.kind] || revision.kind}</span> · {revision.actorName} · {when(revision.capturedAt)}</summary>
      <div className="mt-3 space-y-3">{revision.kind === 'edit' ? <><FullText label="Before — full description" value={revision.beforeText} /><FullText label="After — full description" value={revision.afterText} /></> : <FullText label="Full saved description" value={revision.afterText} />}</div>
    </details>)}
    {history.hasNextPage && <Button size="sm" variant="outline" disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>{history.isFetchingNextPage ? 'Loading…' : 'Load older full revisions'}</Button>}
    {!!first.legacy?.length && <details className="rounded-lg border border-amber-500/40 p-3"><summary className="cursor-pointer text-xs font-semibold">Older partial records ({first.legacy.length})</summary><p className="my-3 text-xs text-muted-foreground">{first.historicalLimit}</p>{first.legacy.map((entry: any, index: number) => <div key={index} className="my-3 space-y-1"><p className="text-xs font-semibold">{entry.actorName} · {when(entry.capturedAt)}</p><pre className="whitespace-pre-wrap break-words text-xs">{entry.details}</pre></div>)}</details>}
  </div>;
}
