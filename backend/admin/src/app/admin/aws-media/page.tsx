"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Cloud, ExternalLink, File, Loader2, RefreshCw, ScanSearch, Search, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
interface S3Object { key: string; size: number; lastModified: string; storageClass: string; }

export default function AwsMediaPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("");
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<(string | null)[]>([null]);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showScan, setShowScan] = useState(false);

  const request = useCallback(async (path: string, options?: RequestInit) => {
    const response = await fetch(`${BACKEND}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.token}`, ...options?.headers } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw Object.assign(new Error(data?.message || "AWS request failed"), { status: response.status, data });
    return data;
  }, [session?.user?.token]);

  const fetchMedia = useCallback(async (token: string | null = tokens[page]) => {
    if (!session?.user?.token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (token) params.set("continuationToken", token);
      const result = await request(`/api/sysadmin/aws-media?${params}`);
      setItems((result.data.items || []).filter((item: any) => item.key));
      setBucket(result.data.bucket || "");
      setNextToken(result.data.nextContinuationToken || null);
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  }, [page, request, session?.user?.token, tokens]);

  useEffect(() => { if (status === "authenticated") void fetchMedia(); }, [status, page]);

  const openObject = async (key: string) => {
    try { const result = await request("/api/sysadmin/aws-media/open", { method: "POST", body: JSON.stringify({ key }) }); window.open(result.data.url, "_blank", "noopener,noreferrer"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteObject = async (key: string, force = false) => {
    if (!force && !confirm(`Delete this S3 object?\n\n${key}`)) return;
    setDeleting(key);
    try {
      await request(`/api/sysadmin/aws-media${force ? "?force=true" : ""}`, { method: "DELETE", body: JSON.stringify({ key }) });
      setItems(current => current.filter(item => item.key !== key));
      toast.success("S3 object deleted");
    } catch (error: any) {
      if (error.status === 409 && confirm(`${error.message}. Delete the object and its website references anyway?`)) await deleteObject(key, true);
      else toast.error(error.message);
    } finally { setDeleting(""); }
  };

  const goNext = () => {
    if (!nextToken) return;
    setTokens(current => [...current.slice(0, page + 1), nextToken]);
    setPage(current => current + 1);
  };
  const scanDatabase = async (cleanup = false) => {
    setScanning(true);
    try {
      const result = await request(`/api/sysadmin/files/scan${cleanup ? "?cleanup=true" : ""}`, { method: "POST", body: JSON.stringify({}) });
      setScanResult(result.data);
      setShowScan(true);
      toast.success(cleanup
        ? `Cleaned up ${result.data.cleanupResult?.removedFileUploads || 0} FileUpload record(s) and ${result.data.cleanupResult?.removedTaskFiles || 0} task entry(ies)`
        : `Scan complete: ${result.data.summary.missingRefs} phantom reference(s) found`);
    } catch (error: any) { toast.error(error.message); }
    finally { setScanning(false); setCleaning(false); }
  };
  const cleanupPhantom = () => {
    if (!confirm(`Permanently remove ${scanResult?.summary?.missingRefs || 0} database record(s) whose S3 object no longer exists? This only deletes the broken DB entries (the objects are already gone).`)) return;
    setCleaning(true);
    scanDatabase(true);
  };
  const filtered = items.filter(item => item.key.toLowerCase().includes(search.toLowerCase()));
  const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return <PageContainer><div className="w-full space-y-6 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tools</p><h1 className="mt-1 text-3xl font-bold">AWS Media Server</h1><p className="mt-2 text-sm text-muted-foreground">Browse, open and safely remove objects from {bucket || "the configured bucket"}.</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter current page..." className="pl-9"/></div><Button variant="outline" onClick={() => scanDatabase(false)} disabled={scanning}><ScanSearch className={`size-4 ${scanning ? "animate-pulse" : ""}`}/>Scan DB</Button><Button variant="outline" onClick={() => fetchMedia()} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`}/></Button></div></div>
    {showScan && scanResult && <div className="rounded-2xl border border-white/10 bg-card/45 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Phantom File Scan</p><p className="mt-1 text-sm text-muted-foreground">{scanResult.summary.refsScanned} DB references, {scanResult.summary.uniqueKeys} unique S3 keys — <span className="font-medium text-destructive">{scanResult.summary.missingRefs} missing</span> (object no longer exists), {scanResult.summary.skippedRefs} non-S3 skipped.</p></div>
        <div className="flex items-center gap-2">
          {scanResult.summary.missingRefs > 0 && !scanResult.cleanup && <Button variant="destructive" size="sm" onClick={cleanupPhantom} disabled={cleaning}>{cleaning ? <Loader2 className="size-4 animate-spin"/> : <Trash2 className="size-4"/>}Remove {scanResult.summary.missingRefs} broken record(s)</Button>}
          {scanResult.cleanup && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">Cleanup complete: {scanResult.cleanupResult?.removedFileUploads || 0} FileUpload + {scanResult.cleanupResult?.removedTaskFiles || 0} task entries removed</span>}
        </div>
      </div>
      <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-white/10">
        {scanResult.missing.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No broken references — every DB record has a live S3 object.</div> : <div className="divide-y divide-white/10">{scanResult.missing.slice(0, 300).map((ref: any, index: number) => <div key={`${ref.kind}-${ref.id}-${ref.key}-${index}`} className="flex items-center gap-3 p-3">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ref.kind === "fileupload" ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>{ref.kind === "fileupload" ? "FileUpload" : "Task"}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm" title={ref.key}>{ref.originalName || ref.filename || "Unnamed"}</p><p className="truncate text-xs text-muted-foreground" title={ref.url}>{ref.key}</p></div>
          {ref.taskTitle && <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:block" title={ref.taskTitle}>{ref.taskTitle}</span>}
        </div>)}</div>}
        {scanResult.missing.length > 300 && <div className="p-3 text-center text-xs text-muted-foreground">Showing first 300 of {scanResult.missing.length} — run cleanup to remove them all.</div>}
      </div>
    </div>}
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/45">
      {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary"/></div> : <div className="divide-y divide-white/10">{filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground">No objects on this page</div> : filtered.map(item => <div key={item.key} className="grid gap-3 p-4 hover:bg-muted/20 md:grid-cols-[minmax(0,1fr)_110px_180px_110px]"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><File className="size-4"/></span><span className="truncate text-sm" title={item.key}>{item.key}</span></div><span className="self-center text-xs text-muted-foreground">{formatBytes(item.size || 0)}</span><span className="self-center text-xs text-muted-foreground">{item.lastModified ? format(new Date(item.lastModified), "dd MMM yy, HH:mm") : "Unknown"}</span><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => openObject(item.key)}><ExternalLink className="size-3.5"/></Button><Button size="sm" variant="outline" className="text-destructive" disabled={deleting === item.key} onClick={() => deleteObject(item.key)}>{deleting === item.key ? <Loader2 className="size-3.5 animate-spin"/> : <Trash2 className="size-3.5"/>}</Button></div></div>)}</div>}
    </div>
    <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Page {page + 1}, up to 100 objects per page</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage(current => current - 1)}><ChevronLeft className="mr-1 size-4"/>Previous</Button><Button variant="outline" disabled={!nextToken || loading} onClick={goNext}>Next<ChevronRight className="ml-1 size-4"/></Button></div></div>
  </div></PageContainer>;
}
