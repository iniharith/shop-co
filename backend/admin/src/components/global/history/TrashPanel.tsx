'use client';
import React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import AxiosInstance from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FILE_QUERY_KEYS } from '@/hooks/useTrashUndo';

export default function TrashPanel() {
  const { data: session } = useSession();
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['trash'], initialPageParam: '', enabled: !!session?.user?.token,
    queryFn: async ({ pageParam }) => (await AxiosInstance(session?.user?.token).get('/api/files/trash', { params: pageParam ? { before: pageParam } : {} })).data,
    getNextPageParam: page => page.nextCursor || undefined,
  });
  const restore = useMutation({
    mutationFn: async (id: string) => (await AxiosInstance(session?.user?.token).post(`/api/files/trash/${id}/restore`)).data,
    onSuccess: () => {
      FILE_QUERY_KEYS.forEach(key => void client.invalidateQueries({ queryKey: [key] }));
      toast.success('Restored from Trash');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || error.message || 'Could not restore item'),
  });
  const permanentlyDelete = useMutation({
    mutationFn: async (id: string) => (await AxiosInstance(session?.user?.token).delete(`/api/files/trash/${id}`, { data: { confirmation: 'DELETE' } })).data,
    onSuccess: () => { FILE_QUERY_KEYS.forEach(key => void client.invalidateQueries({ queryKey: [key] })); toast.success('Permanently deleted'); },
    onError: (error: any) => toast.error(error.response?.data?.message || error.message || 'Permanent deletion failed; data retained for retry'),
  });
  const items = (query.data?.pages || []).flatMap(page => page.data || []);
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">Deleted files and tasks</h2><p className="text-sm text-muted-foreground">Deleted files and tasks can be restored for 15 minutes. After that, the server permanently deletes them.</p></div>
      <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>Refresh Trash</Button>
    </div>
    {query.isPending ? <p>Loading Trash…</p> : query.isError ? <p className="text-destructive">Could not load Trash. Try Refresh Trash.</p> : !items.length ? <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Trash is empty.</p> :
      <ul className="divide-y rounded-xl border bg-card">{items.map((item: any) => <li key={item._id} className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0"><p className="break-all font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.kind === 'task' ? 'Task' : 'File'} · Deleted {new Date(item.deletedAt).toLocaleString()}{item.state === 'purging' ? ' · Permanent deletion in progress' : item.purgeAt ? ` · Permanently deleted after ${new Date(item.purgeAt).toLocaleTimeString()}` : ''}</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" disabled={restore.isPending || permanentlyDelete.isPending || item.state !== 'deleted' || (item.purgeAt && new Date(item.purgeAt).getTime() <= Date.now())} onClick={() => restore.mutate(item._id)}>Restore</Button>
          <Button variant="destructive" disabled={restore.isPending || permanentlyDelete.isPending} onClick={() => { if (window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) permanentlyDelete.mutate(item._id); }}>Permanently delete</Button>
        </div>
      </li>)}</ul>}
    {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more deleted items</Button>}
  </section>;
}
