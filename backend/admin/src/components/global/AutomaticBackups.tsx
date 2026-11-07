"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AxiosInstance from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AutomaticBackups({ token }: { token: string }) {
  const [creating, setCreating] = useState(false), [downloading, setDownloading] = useState('');
  const backups = useQuery({ queryKey: ['automatic-database-backups'], enabled: !!token,
    queryFn: async () => (await AxiosInstance(token).get('/api/tools/database-backups')).data,
    refetchInterval: query => query.state.data?.backups?.some((b: any) => b.status === 'running') ? 5000 : 60000,
  });
  async function create() {
    setCreating(true);
    try { await AxiosInstance(token).post('/api/tools/database-backups'); toast.success('Backup started. You can keep working.'); await backups.refetch(); }
    catch { toast.error('Backup could not start. Check configuration or an existing running backup.'); }
    finally { setCreating(false); }
  }
  async function download(backup: any) {
    setDownloading(backup.id);
    try {
      const response = await AxiosInstance(token).get(`/api/tools/database-backups/${backup.id}/download`, { responseType: 'blob', timeout: 600000 });
      const url = URL.createObjectURL(response.data), a = document.createElement('a'); a.href = url; a.download = backup.filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error('Backup download failed. No completed download was saved.'); }
    finally { setDownloading(''); }
  }
  return <section className="space-y-3 rounded-2xl border p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Automatic database backups</h2><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => backups.refetch()}>Refresh</Button><Button size="sm" disabled={creating || !backups.data?.configured || backups.data?.backups?.some((b: any) => b.status === 'running')} onClick={create}>{creating ? 'Starting…' : 'Back up now'}</Button></div></div>
    {backups.isError ? <p className="text-sm text-destructive">Could not load backups. Retry using Refresh.</p> : backups.isPending ? <p className="text-sm text-muted-foreground">Loading backups…</p> : <>
      <p className="text-sm">{backups.data.enabled && backups.data.configured ? 'Automatic backups enabled' : 'Automatic backups are not configured/enabled'} · Daily at 3:00 AM Malaysia time</p>
      <p className="text-xs text-muted-foreground">Full database archives, including descriptions and revision history. Stored encrypted outside the database. Downloads are decrypted restorable MongoDB archives. Artwork binaries are not included; file references are included. Older backups are retained.</p>
      {!backups.data.backups.length && <p className="text-sm text-muted-foreground">No scheduled backups yet.</p>}
      <div className="max-h-96 space-y-2 overflow-auto">{backups.data.backups.map((backup: any) => <div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs"><div><p className="font-semibold">{new Date(backup.startedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} MYT · {backup.status}</p>{backup.status === 'completed' && <p>{(backup.bytes / 1024 / 1024).toFixed(1)} MB · {backup.automatic ? 'Automatic' : 'Manual'}</p>}{backup.error && <p className="text-destructive">{backup.error}</p>}{backup.sha256 && <p className="max-w-xl break-all font-mono text-[10px] text-muted-foreground">SHA-256: {backup.sha256}</p>}</div>{backup.status === 'completed' && <Button size="sm" variant="outline" disabled={!!downloading} onClick={() => download(backup)}>{downloading === backup.id ? 'Downloading…' : 'Download backup'}</Button>}</div>)}</div>
    </>}
  </section>;
}
