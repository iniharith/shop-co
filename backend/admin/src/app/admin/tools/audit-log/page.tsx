"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import PageContainer from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function AuditLogPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const token = session?.user?.token;
    if (!token) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (search.trim()) params.set("q", search.trim());
        if (action !== "all") params.set("action", action);
        const response = await fetch(`${BACKEND}/api/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load logs");
        setLogs(data.data || []);
        setPages(data.pagination?.pages || 1);
      } catch (error: any) {
        if (error.name !== 'AbortError') setLogs([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [session?.user?.token, search, action, page]);

  return (
    <PageContainer>
      <div className="w-full space-y-6 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tools</p><h1 className="mt-1 text-3xl font-bold">Website Logs</h1><p className="mt-2 text-sm text-muted-foreground">Append-only history of successful website changes.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search actor or action..." className="w-full pl-9 sm:w-64" /></div>
            <Select value={action} onValueChange={value => { setAction(value); setPage(1); }}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All actions</SelectItem><SelectItem value="create">Create</SelectItem><SelectItem value="update">Update</SelectItem><SelectItem value="delete">Delete</SelectItem><SelectItem value="file_add">File added</SelectItem><SelectItem value="file_delete">File deleted</SelectItem><SelectItem value="status_change">Status changed</SelectItem></SelectContent></Select>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/45">
          {loading ? <div className="flex h-52 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div> : logs.length === 0 ? <div className="flex h-52 flex-col items-center justify-center text-muted-foreground"><ClipboardList className="mb-3 size-8" /><p>No matching logs</p></div> : <div className="divide-y divide-white/10">{logs.map(log => <div key={log._id} className="grid gap-3 p-4 text-sm hover:bg-muted/20 md:grid-cols-[150px_160px_130px_1fr]"><span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd MMM yy, HH:mm:ss")}</span><span className="font-medium">{log.actorName}<small className="ml-2 text-muted-foreground">{log.actorRole}</small></span><span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{log.action.replace(/_/g, " ")}</span><div><p>{log.summary}</p><p className="mt-1 truncate text-xs text-muted-foreground">{log.method} {log.route}</p></div></div>)}</div>}
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)}>Previous</Button><span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage(current => current + 1)}>Next</Button></div>
      </div>
    </PageContainer>
  );
}
