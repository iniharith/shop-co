"use client";

import { useState } from "react";
import {
  Activity,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WebVitalsDays, WebVitalsStats, WebVitalsSummaryItem } from "@/api/webVitals";
import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWebVitalsStats } from "@/hooks/useWebVitals";

const dayOptions: WebVitalsDays[] = [7, 14, 30, 60, 90];

const METRIC_CONFIG: Record<string, { label: string; unit: string; good: number; poor: number; description: string }> = {
  lcp: { label: "LCP", unit: "ms", good: 2500, poor: 4000, description: "Largest Contentful Paint" },
  inp: { label: "INP", unit: "ms", good: 200, poor: 500, description: "Interaction to Next Paint" },
  cls: { label: "CLS", unit: "", good: 0.1, poor: 0.25, description: "Cumulative Layout Shift" },
  fcp: { label: "FCP", unit: "ms", good: 1800, poor: 3000, description: "First Contentful Paint" },
  ttfb: { label: "TTFB", unit: "ms", good: 800, poor: 1800, description: "Time to First Byte" },
};

const ratingFor = (metric: string, value: number | null) => {
  if (value === null) return "none";
  const config = METRIC_CONFIG[metric];
  if (value <= config.good) return "good";
  if (value <= config.poor) return "needs-improvement";
  return "poor";
};

const formatValue = (metric: string, value: number | null) => {
  if (value === null) return "—";
  const config = METRIC_CONFIG[metric];
  if (metric === "cls") return value.toFixed(3);
  return config.unit === "ms" ? `${Math.round(value)} ms` : String(value);
};

const ratingBadge = (rating: string) => {
  if (rating === "good") return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">Good</Badge>;
  if (rating === "needs-improvement") return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">Needs Improvement</Badge>;
  if (rating === "poor") return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/15">Poor</Badge>;
  return <Badge variant="outline">No data</Badge>;
};

const RATING_COLORS = {
  good: "#10b981",
  "needs-improvement": "#f59e0b",
  poor: "#ef4444",
};

const isEmpty = (data: WebVitalsStats) => data.totalSamples === 0;

function SummaryCard({ item }: { item: WebVitalsSummaryItem }) {
  const config = METRIC_CONFIG[item.metric] || { label: item.metric.toUpperCase(), unit: "", good: 0, poor: 0, description: "" };
  const rating = ratingFor(item.metric, item.p75);
  const p75Bar = Math.min(100, item.p75 !== null && config.good > 0 ? (item.p75 / config.poor) * 100 : 0);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{config.label}</span>
          </div>
          {ratingBadge(rating)}
        </div>
        <div className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
          {formatValue(item.metric, item.p75)}
          <span className="ml-1 text-sm font-medium text-muted-foreground">p75</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${rating === "good" ? "bg-emerald-500" : rating === "needs-improvement" ? "bg-amber-500" : rating === "poor" ? "bg-red-500" : "bg-muted-foreground/30"}`}
              style={{ width: `${p75Bar}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.count} samples</span>
          <span>{item.goodRate !== null ? `${item.goodRate}% good` : "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MonitoringPage() {
  const [days, setDays] = useState<WebVitalsDays>(30);
  const [selectedMetric, setSelectedMetric] = useState<string>("lcp");
  const { data, isPending, isError, isFetching, refetch } = useWebVitalsStats(days);

  const summary = data?.summary || [];
  const selectedSummary = summary.find(item => item.metric === selectedMetric);
  const config = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.lcp;

  const ratingDistribution = selectedSummary
    ? [
        { name: "Good", value: selectedSummary.good, color: RATING_COLORS.good },
        { name: "Needs Improvement", value: selectedSummary.needsImprovement, color: RATING_COLORS["needs-improvement"] },
        { name: "Poor", value: selectedSummary.poor, color: RATING_COLORS.poor },
      ]
    : [];

  const trendData = (data?.trend || []).map(row => ({
    date: row.date,
    value: (row as any)[selectedMetric],
  }));

  const totalDevice = (data?.devices.mobile || 0) + (data?.devices.desktop || 0);
  const deviceData = [
    { name: "Desktop", value: data?.devices.desktop || 0, color: "#3b82f6" },
    { name: "Mobile", value: data?.devices.mobile || 0, color: "#8b5cf6" },
  ];

  return (
    <PageContainer>
      <main className="w-full min-w-0 space-y-5 pb-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/55 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-end sm:justify-between md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Speed Insights</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Monitoring</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Core Web Vitals collected from real admin sessions — a self-hosted view like the Vercel Speed Insights dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">Time range</span>
            <Select value={String(days)} onValueChange={value => setDays(Number(value) as WebVitalsDays)}>
              <SelectTrigger className="w-32 bg-background/70" aria-label="Monitoring time range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map(option => (
                  <SelectItem key={option} value={String(option)}>{option} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="shrink-0" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : isError || !data ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">Could not load monitoring data</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        ) : isEmpty(data) ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Gauge className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No data yet</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Web vitals are collected as you browse the admin. Visit a few pages — LCP, CLS, INP, FCP and TTFB will
                appear here within minutes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {summary.map(item => (
                <SummaryCard key={item.metric} item={item} />
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {/* Ratings + devices */}
              <Card className="lg:col-span-1 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{config.label} ratings</CardTitle>
                  <CardDescription>Distribution of the last {days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistribution} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {ratingDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devices</p>
                    {deviceData.map(device => {
                      const pct = totalDevice > 0 ? Math.round((device.value / totalDevice) * 100) : 0;
                      return (
                        <div key={device.name} className="mb-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              {device.name === "Mobile" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                              {device.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{device.value} ({pct}%)</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: device.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Trend */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{config.label} trend (p75)</CardTitle>
                    <CardDescription>Median of the 75th percentile per day</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(METRIC_CONFIG).map(metric => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          selectedMetric === metric
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {METRIC_CONFIG[metric].label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 8 }}>
                        <defs>
                          <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tickFormatter={value => {
                          const parts = String(value).split("-");
                          return `${parts[1]}/${parts[2]}`;
                        }} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} />
                        <Tooltip formatter={value => [value === null ? "—" : String(value), `${config.label} p75`]} />
                        <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#metricFill)" connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top routes */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  Top routes
                </CardTitle>
                <CardDescription>Most visited admin pages and their overall p75</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topRoutes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No route data in this range.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead className="text-right">Samples</TableHead>
                        <TableHead className="text-right">p75</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topRoutes.map(route => (
                        <TableRow key={route.route}>
                          <TableCell className="font-mono text-xs">{route.route}</TableCell>
                          <TableCell className="text-right tabular-nums">{route.count}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {route.p75 === null ? "—" : `${Math.round(route.p75)} ms`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </PageContainer>
  );
}
