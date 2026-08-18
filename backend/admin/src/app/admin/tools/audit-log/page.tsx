"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Loader2, RotateCcw, Search, SlidersHorizontal, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import PageContainer from "@/components/layout/page-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type ActorOption = { value: string; name: string; role: string };
type FilterOptions = { actors: ActorOption[]; actions: string[] };

const DEFAULT_ACTIONS = ["create", "update", "delete", "file_add", "file_delete", "status_change", "login", "login_failed", "register", "magic_login", "magic_link"];
const formatAction = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());

export default function AuditLogPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ actors: [], actions: DEFAULT_ACTIONS });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = session?.user?.token;
    if (!token) return;
    const controller = new AbortController();
    fetch(`${BACKEND}/api/audit-logs/filters`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setFilterOptions({ actors: data.data?.actors || [], actions: data.data?.actions?.length ? data.data.actions : DEFAULT_ACTIONS }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [session?.user?.token]);

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
        if (actor !== "all") params.set("actor", actor);
        if (dateFrom) params.set("from", new Date(`${dateFrom}T00:00:00`).toISOString());
        if (dateTo) params.set("to", new Date(`${dateTo}T23:59:59.999`).toISOString());
        const [sortBy, sortOrder] = sort.split("-");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        const response = await fetch(`${BACKEND}/api/audit-logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load logs");
        setLogs(data.data || []);
        setPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setLogs([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [session?.user?.token, search, action, actor, dateFrom, dateTo, sort, page]);

  const resetFilters = () => {
    setSearch("");
    setAction("all");
    setActor("all");
    setDateFrom("");
    setDateTo("");
    setSort("date-desc");
    setPage(1);
  };

  const hasFilters = search || action !== "all" || actor !== "all" || dateFrom || dateTo || sort !== "date-desc";

  return (
    <PageContainer>
      <div className="w-full space-y-6 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tools</p>
          <h1 className="mt-1 text-3xl font-bold">Website Logs</h1>
          <p className="mt-2 text-sm text-muted-foreground">Append-only history of successful website changes.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/35 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-primary" /> Filter and sort logs</div>
            {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="mr-2 size-3.5" /> Reset</Button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search user or summary..." className="pl-9" />
            </div>
            <Select value={actor} onValueChange={value => { setActor(value); setPage(1); }}>
              <SelectTrigger><Users className="mr-2 size-4 text-muted-foreground" /><SelectValue placeholder="All users" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All users</SelectItem>{filterOptions.actors.map(option => <SelectItem key={option.value} value={option.value}>{option.name} ({option.role})</SelectItem>)}</SelectContent>
            </Select>
            <Select value={action} onValueChange={value => { setAction(value); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All actions</SelectItem>{filterOptions.actions.map(value => <SelectItem key={value} value={value}>{formatAction(value)}</SelectItem>)}</SelectContent>
            </Select>
            <label className="relative">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">From date</span>
              <CalendarDays className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground" />
              <Input type="date" value={dateFrom} max={dateTo || undefined} onChange={event => { setDateFrom(event.target.value); setPage(1); }} className="pl-9" />
            </label>
            <label className="relative">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">To date</span>
              <CalendarDays className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground" />
              <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={event => { setDateTo(event.target.value); setPage(1); }} className="pl-9" />
            </label>
            <div className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort by</span>
              <Select value={sort} onValueChange={value => { setSort(value); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date: newest first</SelectItem>
                  <SelectItem value="date-asc">Date: oldest first</SelectItem>
                  <SelectItem value="user-asc">User: A to Z</SelectItem>
                  <SelectItem value="user-desc">User: Z to A</SelectItem>
                  <SelectItem value="action-asc">Action: A to Z</SelectItem>
                  <SelectItem value="action-desc">Action: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/45">
          <div className="hidden grid-cols-[150px_180px_140px_1fr] gap-3 border-b border-white/10 bg-muted/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Date</span><span>User</span><span>Action</span><span>Details</span>
          </div>
          {loading ? (
            <div className="flex h-52 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : logs.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center text-muted-foreground"><ClipboardList className="mb-3 size-8" /><p>No matching logs</p></div>
          ) : (
            <div className="divide-y divide-white/10">{logs.map(log => (
              <div key={log._id} className="grid gap-3 p-4 text-sm hover:bg-muted/20 md:grid-cols-[150px_180px_140px_1fr]">
                <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd MMM yy, HH:mm:ss")}</span>
                <span className="font-medium">{log.actorName}<small className="ml-2 text-muted-foreground">{log.actorRole}</small></span>
                <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{formatAction(log.action)}</span>
                <div><p>{log.summary}</p><p className="mt-1 truncate text-xs text-muted-foreground">{log.method} {log.route}</p></div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} matching log{total === 1 ? "" : "s"}</span>
          <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)}>Previous</Button><span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage(current => current + 1)}>Next</Button></div>
        </div>
      </div>
    </PageContainer>
  );
}
