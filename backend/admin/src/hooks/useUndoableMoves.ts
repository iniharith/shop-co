'use client';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/api/tasks';
import { getOrder, updateOrderStatus } from '@/api/orders';
import { toast } from 'sonner';
import { UNDO_DURATION } from './useTrashUndo';

type Target = { id: string; kind: 'task' | 'order'; previousStatus?: string };
type Applied = Target & { previousStatus: string; version?: string; workflowVersion?: string };
async function settle<T>(items: T[], work: (item: T) => Promise<any>) {
  const results: PromiseSettledResult<any>[] = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
    while (next < items.length) { const index = next++; try { results[index] = { status: 'fulfilled', value: await work(items[index]) }; } catch (reason) { results[index] = { status: 'rejected', reason }; } }
  }));
  return results;
}
export function useUndoableMoves() {
  const { data: session } = useSession(); const client = useQueryClient();
  const working = useRef(false); const [isPending, setPending] = useState(false);
  const refresh = () => ['tasks', 'task', 'orders', 'order', 'folderGroup'].forEach(key => void client.invalidateQueries({ queryKey: [key], refetchType: 'active' }));
  const move = async (targets: Target[], status: string, onUndo?: () => void) => {
    if (working.current) { toast.info('Wait for the current move.'); return; }
    working.current = true; setPending(true);
    const unique = [...new Map(targets.map(target => [`${target.kind}:${target.id}`, target])).values()];
    try {
      const results = await settle(unique, async target => {
        if (target.kind === 'task') {
          const data = await updateTask(session?.user?.token, target.id, { status });
          return { ...target, previousStatus: data?.previous?.status || target.previousStatus, version: data?.task?.updatedAt, workflowVersion: data?.undoVersion };
        }
        const before = target.previousStatus || (await getOrder(session?.user?.token, target.id))?.order?.orderStatus;
        await updateOrderStatus(session?.user?.token, target.id, status);
        return { ...target, previousStatus: before };
      });
      const moved: Applied[] = results.filter((result): result is PromiseFulfilledResult<Applied> => result.status === 'fulfilled').map(result => result.value);
      const failed = results.length - moved.length;
      const recoverable = moved.filter(item => item.previousStatus && item.previousStatus !== status);
      refresh();
      const undoExpiresAt = Date.now() + UNDO_DURATION;
      if (moved.length) toast.success(`Moved ${moved.length} item(s) to ${status.replace(/_/g, ' ')}`, {
        duration: UNDO_DURATION,
        ...(recoverable.length ? { action: { label: 'Undo', onClick: () => { if (Date.now() >= undoExpiresAt) { toast.info('The 15-minute Undo window has expired.'); return; } void (async () => {
          const undone = await settle(recoverable, async target => {
            if (target.kind === 'task') return updateTask(session?.user?.token, target.id, { status: target.previousStatus, ...(target.workflowVersion ? { expectedWorkflowVersion: target.workflowVersion } : { expectedUpdatedAt: target.version }) });
            const current = await getOrder(session?.user?.token, target.id);
            if (current?.order?.orderStatus !== status) throw new Error('Order changed again');
            return updateOrderStatus(session?.user?.token, target.id, target.previousStatus);
          });
          refresh(); onUndo?.();
          const failures = undone.filter(result => result.status === 'rejected').length;
          if (failures) toast.error(`${failures} item(s) changed again or could not be restored. Refresh before retrying.`);
          else toast.success('Move undone');
        })(); } } } : {}),
      });
      if (failed) toast.error(`${failed} item(s) could not be moved.`);
    } finally { working.current = false; setPending(false); }
  };
  return { move, isPending };
}
