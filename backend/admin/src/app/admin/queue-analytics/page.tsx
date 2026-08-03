"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  Layers3,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import type { QueueAnalyticsData, QueueAnalyticsDays } from "@/api/queue-analytics";
import PageContainer from "@/components/layout/page-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueueAnalytics } from "@/hooks/useQueueAnalytics";

const dayOptions: QueueAnalyticsDays[] = [7, 14, 30, 60, 90];

const formatHours = (hours: number | null) => {
  if (hours === null) return "Not available";
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const formatStatus = (status: string) =>
  status.replace(/[_-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase());

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const isEmpty = (data: QueueAnalyticsData) =>
  data.summary.currentWip === 0 &&
  data.summary.completedInRange === 0 &&
  data.statusBreakdown.length === 0 &&
  data.staffWorkload.length === 0 &&
  data.dailyThroughput.every(day => day.created === 0 && day.completed === 0) &&
  data.oldestTasks.length === 0;

export default function QueueAnalyticsPage() {
  const [days, setDays] = useState<QueueAnalyticsDays>(30);
  const { data, isPending, isError, isFetching, refetch } = useQueueAnalytics(days);

  return (
    <PageContainer>
      <main className="w-full min-w-0 space-y-5 pb-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/55 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-end sm:justify-between md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Operations beta</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Queue Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Current workload, aging, throughput, and queue pressure in one operational view.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">Time range</span>
            <Select value={String(days)} onValueChange={value => setDays(Number(value) as QueueAnalyticsDays)}>
              <SelectTrigger className="w-32 bg-background/70" aria-label="Analytics time range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map(option => (
                  <SelectItem key={option} value={String(option)}>{option} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {isPending ? <LoadingState /> : isError ? (
          <ErrorState isFetching={isFetching} onRetry={() => void refetch()} />
        ) : data ? (
          <>
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>
                {data.dataQuality.mode === "historical"
                  ? "Historical completion data"
                  : data.dataQuality.mode === "mixed"
                    ? "Mixed historical and estimated data"
                    : "Estimated legacy completion data"}
              </AlertTitle>
              <AlertDescription className="text-amber-900/75 dark:text-amber-100/70">
                {data.dataQuality.note} Use these figures as operational indicators rather than audited records.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{formatDate(data.range.from)} to {formatDate(data.range.to)}</span>
              <span>Timezone: {data.range.timezone}</span>
            </div>

            {isEmpty(data) ? <EmptyState message={`No queue activity was found for the last ${days} days.`} /> : (
              <Dashboard data={data} />
            )}
          </>
        ) : null}
      </main>
    </PageContainer>
  );
}

function Dashboard({ data }: { data: QueueAnalyticsData }) {
  const summaryCards = [
    { label: "Current WIP", value: data.summary.currentWip.toLocaleString(), icon: Layers3, tone: "text-blue-500" },
    { label: "Overdue", value: data.summary.overdueTasks.toLocaleString(), icon: AlertTriangle, tone: "text-rose-500" },
    { label: "Overdue rate", value: `${data.summary.overdueRate.toFixed(1)}%`, icon: Clock3, tone: "text-orange-500" },
    { label: "Unassigned", value: data.summary.unassignedTasks.toLocaleString(), icon: Users, tone: "text-violet-500" },
    { label: "Completed", value: data.summary.completedInRange.toLocaleString(), icon: CheckCircle2, tone: "text-emerald-500" },
    { label: "Avg. completion", value: formatHours(data.summary.avgCompletionHours), icon: Clock3, tone: "text-cyan-500" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <Icon className={`size-4 shrink-0 ${tone}`} />
              </div>
              <p className="mt-3 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-border/70 bg-card/60 shadow-sm">
        <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
          <CardTitle className="text-base">Created vs completed throughput</CardTitle>
          <p className="text-xs text-muted-foreground">Daily task movement across the selected range</p>
        </CardHeader>
        <CardContent className="p-2 pt-2 sm:p-5 sm:pt-2">
          {data.dailyThroughput.length ? (
            <div className="h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyThroughput} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="queueCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="queueCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={value => String(value).slice(5)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelFormatter={value => formatDate(String(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#60a5fa" fill="url(#queueCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" fill="url(#queueCompleted)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <SectionEmpty label="No throughput data in this range." />}
        </CardContent>
      </Card>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <DataCard title="Status breakdown" subtitle="Open work by current status">
          {data.statusBreakdown.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Tasks</TableHead><TableHead className="text-right">Avg. age</TableHead><TableHead className="text-right">Overdue</TableHead></TableRow></TableHeader>
              <TableBody>{data.statusBreakdown.map(item => (
                <TableRow key={item.status}><TableCell className="font-medium">{formatStatus(item.status)}</TableCell><TableCell className="text-right tabular-nums">{item.count}</TableCell><TableCell className="text-right tabular-nums">{formatHours(item.avgAgeHours)}</TableCell><TableCell className="text-right tabular-nums text-rose-500">{item.overdue}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          ) : <SectionEmpty label="No status data available." />}
        </DataCard>

        <DataCard title="Staff workload" subtitle="Assigned open work and aging">
          {data.staffWorkload.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Assignee</TableHead><TableHead className="text-right">Tasks</TableHead><TableHead className="text-right">Overdue</TableHead><TableHead className="text-right">Oldest</TableHead></TableRow></TableHeader>
              <TableBody>{data.staffWorkload.map((item, index) => (
                <TableRow key={item.assigneeId ?? `unassigned-${index}`}><TableCell className="max-w-44 truncate font-medium">{item.assigneeName || "Unassigned"}</TableCell><TableCell className="text-right tabular-nums">{item.count}</TableCell><TableCell className="text-right tabular-nums text-rose-500">{item.overdue}</TableCell><TableCell className="text-right tabular-nums">{formatHours(item.oldestAgeHours)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          ) : <SectionEmpty label="No staff workload data available." />}
        </DataCard>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <DataCard title="Bottleneck ranking" subtitle="Statuses ranked by estimated queue pressure">
          {data.bottlenecks.length ? (
            <ol className="space-y-4 p-4 pt-2 sm:p-5 sm:pt-2">
              {data.bottlenecks.map((item, index) => {
                const maxScore = data.bottlenecks[0]?.score || 1;
                return (
                  <li key={item.status} className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{formatStatus(item.status)}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{item.score.toFixed(1)}</span>
                    </div>
                    <div className="ml-9 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (item.score / maxScore) * 100)}%` }} /></div>
                    <p className="ml-9 text-xs text-muted-foreground">{item.count} tasks · {formatHours(item.avgAgeHours)} average age · {item.overdue} overdue</p>
                  </li>
                );
              })}
            </ol>
          ) : <SectionEmpty label="No bottlenecks detected in this range." />}
        </DataCard>

        <DataCard title="Oldest tasks" subtitle="Longest-running work currently in the queue">
          {data.oldestTasks.length ? (
            <div className="divide-y divide-border/70">
              {data.oldestTasks.map(task => (
                <Link key={task.id} href={`/admin/tasks?taskId=${encodeURIComponent(task.id)}`} className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{task.title}</p>
                      <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">{formatStatus(task.status)}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{task.assigneeName || "Unassigned"}{task.orderId ? ` · Order ${task.orderId}` : ""}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{formatHours(task.ageHours)}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          ) : <SectionEmpty label="No open tasks to display." />}
        </DataCard>
      </section>
    </div>
  );
}

function DataCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 bg-card/60 shadow-sm">
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2"><CardTitle className="text-base">{title}</CardTitle><p className="text-xs text-muted-foreground">{subtitle}</p></CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading queue analytics">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-24" />)}</div>
      <Skeleton className="h-80 w-full" />
      <div className="grid gap-5 xl:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </div>
  );
}

function ErrorState({ isFetching, onRetry }: { isFetching: boolean; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="size-9 text-destructive" />
        <h2 className="mt-4 font-semibold">Queue analytics could not be loaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button className="mt-5" variant="outline" disabled={isFetching} onClick={onRetry}><RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />Retry</Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed bg-card/40"><CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center"><Inbox className="size-10 text-muted-foreground/60" /><h2 className="mt-4 font-semibold">No queue data</h2><p className="mt-1 text-sm text-muted-foreground">{message}</p></CardContent></Card>
  );
}

function SectionEmpty({ label }: { label: string }) {
  return <div className="flex min-h-32 items-center justify-center p-5 text-center text-sm text-muted-foreground">{label}</div>;
}
