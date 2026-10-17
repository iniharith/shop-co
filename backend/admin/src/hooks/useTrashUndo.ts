import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import AxiosInstance from '@/utils/axios';
import { toast } from 'sonner';

export const UNDO_DURATION = 15 * 60000;
export const FILE_QUERY_KEYS = ['tasks', 'task', 'allFiles', 'groupedFiles', 'fileIndex', 'folderGroup', 'filesByFolder', 'fileStats', 'trash'];
export function useTrashUndo() {
  const { data: session } = useSession();
  const client = useQueryClient();
  const refresh = () => FILE_QUERY_KEYS.forEach(key => void client.invalidateQueries({ queryKey: [key], refetchType: 'active' }));
  const restore = async (ids: string[]) => {
    const results = await Promise.allSettled(ids.map(id => AxiosInstance(session?.user?.token).post(`/api/files/trash/${id}/restore`)));
    refresh();
    const failed = results.filter(result => result.status === 'rejected').length;
    if (failed) toast.error(`${failed} item(s) could not be restored. Open History → Trash for details.`);
    else toast.success('Restored from Trash');
  };
  const offer = (data: any) => {
    const ids = data?.trashIds || (data?.trashId ? [data.trashId] : []);
    refresh();
    const undoExpiresAt = data?.purgeAt ? new Date(data.purgeAt).getTime() : Date.now() + UNDO_DURATION;
    if (ids.length) toast.success(`${ids.length} file${ids.length > 1 ? 's' : ''} moved to Trash`, {
      duration: Math.max(1, undoExpiresAt - Date.now()), description: 'Undo or restore from History → Trash within 15 minutes, before permanent deletion.',
      action: { label: 'Undo', onClick: () => { if (Date.now() >= undoExpiresAt) { toast.info('The 15-minute recovery window has expired.'); return; } void restore(ids); } },
    });
    if (data?.errors?.length) toast.error(`${data.errors.length} file(s) could not be deleted.`);
  };
  return { offer, restore, refresh };
}
