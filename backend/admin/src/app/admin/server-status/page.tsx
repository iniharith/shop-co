"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Cloud, Database, ExternalLink, HardDrive, Loader2, MemoryStick, RefreshCw, Server, Timer, Wifi } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const formatBytes = (bytes = 0) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : bytes < 1024 ** 3 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${(bytes / 1024 ** 3).toFixed(1)} GB`;
const formatUptime = (seconds = 0) => `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export default function ServerStatusPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);

  const fetchHealth = useCallback(async (initial = false) => {
    const token = session?.user?.token;
    if (!token) return;
    initial ? setLoading(true) : setRefreshing(true);
    try {
      const response = await fetch(`${BACKEND}/api/sysadmin/health`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.message || "Health service unavailable");
      setData(result.data);
      setLastSuccess(new Date(result.data.timestamp || Date.now()));
      setError("");
    } catch (err: any) { setError(err.message || "Health service unavailable"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [session?.user?.token]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetchHealth(true);
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => { timeout = setTimeout(async () => { if (!document.hidden) await fetchHealth(); schedule(); }, 30000); };
    schedule();
    return () => clearTimeout(timeout);
  }, [status, fetchHealth]);

  if (loading && !data) return <div className="flex h-full items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (!data) return <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground"><p>{error || "No health data available"}</p><Button onClick={() => fetchHealth(true)}>Try Again</Button></div>;

  const memoryPercent = data.server.totalMem ? Math.round(data.server.usedMem / data.server.totalMem * 100) : 0;
  const diskPercent = data.server.diskTotal ? Math.round((data.server.diskTotal - data.server.diskFree) / data.server.diskTotal * 100) : 0;
  const bandwidth = data.charts?.bandwidth || [];
  const latestBandwidth = bandwidth[bandwidth.length - 1];
  const progression = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: data.charts?.progression?.find((entry: any) => entry._id === key)?.count || 0 };
  });

  return <PageContainer><div className="w-full space-y-6 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Infrastructure</p><h1 className="mt-1 text-3xl font-bold">Server Status</h1><p className="mt-2 text-sm text-muted-foreground">Application, container and integration telemetry with 30-second refresh.</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{lastSuccess ? `Updated ${formatDistanceToNow(lastSuccess, { addSuffix: true })}` : "Never updated"}</span><Button variant="outline" onClick={() => fetchHealth()} disabled={refreshing}>{refreshing ? <Loader2 className="mr-2 size-4 animate-spin"/> : <RefreshCw className="mr-2 size-4"/>}Refresh</Button></div></div>
    {error && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">Showing last successful data. Refresh failed: {error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={MemoryStick} title="Container memory" value={`${memoryPercent}%`} detail={`${formatBytes(data.server.usedMem)} of ${formatBytes(data.server.totalMem)}`} tone="text-emerald-400 bg-emerald-500/10" />
      <Metric icon={Activity} title="System load (1 min)" value={Number(data.server.cpuLoad?.[0] || 0).toFixed(2)} detail={`${data.server.cpuLoad?.length || 0} load averages reported`} tone="text-blue-400 bg-blue-500/10" />
      <Metric icon={HardDrive} title="Ephemeral disk" value={`${diskPercent}%`} detail={`${formatBytes(data.server.diskFree)} free`} tone="text-amber-400 bg-amber-500/10" />
      <Metric icon={Timer} title="Container uptime" value={formatUptime(data.server.uptime)} detail="Resets when the service restarts" tone="text-violet-400 bg-violet-500/10" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-[26px] border border-white/10 bg-card/50 p-5 md:p-6"><div className="mb-5"><h2 className="font-semibold">Tasks created in the last 7 days</h2><p className="text-xs text-muted-foreground">Creation volume, not task completion.</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={progression}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15}/><XAxis dataKey="date" tickFormatter={value => value.slice(5)} fontSize={11}/><YAxis allowDecimals={false} fontSize={11}/><Tooltip contentStyle={{ borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/><Bar dataKey="count" fill="hsl(var(--primary))" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><Metric icon={Server} title="Application records" value={`${data.application.taskTotal} tasks`} detail={`${data.application.artworkTotal} artwork records`} tone="text-primary bg-primary/10"/><Metric icon={Wifi} title="Backend HTTP traffic" value={`${formatBytes(latestBandwidth?.bytesOut || 0)} / 5s`} detail={`${formatBytes(latestBandwidth?.bytesIn || 0)} received in sample window`} tone="text-cyan-400 bg-cyan-500/10"/><Metric icon={Cloud} title="Tracked file metadata" value={formatBytes(data.application.storageUsed)} detail="Database total; not full S3 bucket usage" tone="text-orange-400 bg-orange-500/10"/></section>
    </div>
    <section><h2 className="mb-4 text-lg font-semibold">Integrations</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatusCard icon={Database} title="MongoDB" status={data.database.status} healthy={data.database.status === "Connected"}/><StatusCard icon={Cloud} title="AWS S3 access" status={data.external.aws} healthy={data.external.aws === "ONLINE"} href="/admin/aws-media"/><StatusCard icon={ExternalLink} title="Latest Vercel deployment" status={data.external.vercel.readyState || "UNCONFIGURED"} healthy={data.external.vercel.readyState === "READY"}/><StatusCard icon={Server} title="Railway API token" status={data.external.railway.status || "UNCONFIGURED"} healthy={data.external.railway.status === "ACTIVE"}/></div></section>
  </div></PageContainer>;
}

function Metric({ icon: Icon, title, value, detail, tone }: any) { return <div className="rounded-[24px] border border-white/10 bg-card/50 p-5"><div className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5"/></div><p className="mt-5 text-xs font-medium text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>; }
function StatusCard({ icon: Icon, title, status, healthy, href }: any) { const content = <div className="rounded-[22px] border border-white/10 bg-card/50 p-5 transition hover:border-primary/30"><div className="flex items-center justify-between"><Icon className="size-5 text-muted-foreground"/><span className={`size-2.5 rounded-full ${healthy ? "bg-emerald-400" : "bg-amber-400"}`}/></div><p className="mt-5 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{status}</p></div>; return href ? <Link href={href}>{content}</Link> : content; }
