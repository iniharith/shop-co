"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Activity, ArrowUpRight, Bot, CalendarRange, ChartNoAxesCombined, ClipboardList, Cloud, Database, Download, Globe2, Layers3, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import AxiosInstance from "@/utils/axios";

type Tool = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sysadminOnly?: boolean;
};

type Section = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentChip: string;
  code: string;
  tools: Tool[];
};

const toolSections: Section[] = [
  {
    label: "Reports & Analytics",
    icon: ChartNoAxesCombined,
    accentChip: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    code: "01 / INSIGHT",
    tools: [
      {
        title: "Staff Reports",
        description: "Sales, orders, storage and operational summaries.",
        href: "/admin/reports",
        icon: ChartNoAxesCombined,
        color: "blue",
      },
      {
        title: "Queue Analytics",
        description: "WIP, throughput, workload and turnaround insights.",
        href: "/admin/queue-analytics",
        icon: Layers3,
        color: "indigo",
      },
      {
        title: "Schedule",
        description: "Gantt chart view of tasks, deadlines and team workload.",
        href: "/admin/schedule",
        icon: CalendarRange,
        color: "cyan",
      },
    ],
  },
  {
    label: "Logs & Monitoring",
    icon: Activity,
    accentChip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    code: "02 / OBSERVE",
    tools: [
      {
        title: "Website Logs",
        description: "Track successful changes, uploads, deletions and status updates.",
        href: "/admin/tools/audit-log",
        icon: ClipboardList,
        color: "rose",
      },
      {
        title: "Server Status",
        description: "Monitor application health, bandwidth and deployments.",
        href: "/admin/server-status",
        icon: Activity,
        color: "emerald",
      },
      {
        title: "Telegram Bot Logs",
        description: "Inspect live Telegram bot activity and responses.",
        href: "/admin/bot-logs",
        icon: Bot,
        color: "green",
        sysadminOnly: true,
      },
    ],
  },
  {
    label: "Media & Production",
    icon: Sparkles,
    accentChip: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    code: "03 / CREATE",
    tools: [
      {
        title: "Image Upscale",
        description: "Improve image resolution before artwork production.",
        href: "/admin/tools/upscale",
        icon: Sparkles,
        color: "violet",
      },
      {
        title: "AWS Media Server",
        description: "Review media storage objects and server usage.",
        href: "/admin/aws-media",
        icon: Cloud,
        color: "amber",
      },
    ],
  },
];

const colorMap: Record<string, string> = {
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  blue: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  indigo: "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  green: "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300",
};

export default function ToolsPage() {
  const { data: session } = useSession();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [serverIp, setServerIp] = useState<{ ip: string; checkedAt: string } | null>(null);
  const [serverIpLoading, setServerIpLoading] = useState(true);
  const [serverIpError, setServerIpError] = useState(false);
  const token = (session?.user as any)?.token || (typeof window !== "undefined" && localStorage.getItem("token")) || "";
  const visibleSections = toolSections
    .map(section => ({
      ...section,
      tools: section.tools.filter(tool => !tool.sysadminOnly || session?.user?.role === "sysadmin"),
    }))
    .filter(section => section.tools.length > 0);
  const totalTools = visibleSections.reduce((sum, s) => sum + s.tools.length, 0) + 1;

  useEffect(() => {
    if (!token) return;
    let active = true;
    const detectServerIp = async () => {
      try {
        const response = await AxiosInstance(token).get<{ success: boolean; data: { ip: string; checkedAt: string } }>("/api/tools/server-ip", { timeout: 10_000 });
        if (active) {
          setServerIp(response.data.data);
          setServerIpError(false);
        }
      } catch {
        if (active) setServerIpError(true);
      } finally {
        if (active) setServerIpLoading(false);
      }
    };
    void detectServerIp();
    const interval = setInterval(() => { if (!document.hidden) void detectServerIp(); }, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);

  const downloadDatabaseBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    const toastId = toast.loading("Preparing database backup...");

    try {
      const response = await AxiosInstance(token).post("/api/tools/database-backup", undefined, {
        responseType: "blob",
        timeout: 600000,
      });
      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shop-co-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.archive.gz`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast.success("Database backup downloaded", { id: toastId });
    } catch (error: any) {
      let message = error?.message || "Database backup failed";
      if (error?.response?.data instanceof Blob) {
        try {
          const payload = JSON.parse(await error.response.data.text());
          message = payload.message || message;
        } catch {}
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message, { id: toastId });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <PageContainer>
      <main className="relative w-full min-w-0 overflow-hidden rounded-[28px] border border-border/70 bg-background/55 shadow-xl backdrop-blur-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent_48%)]"
        />

        <header className="relative grid min-h-[290px] border-b border-border/70 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="flex flex-col justify-between gap-12 p-5 sm:p-7 lg:p-10">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-500/35" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              </span>
              Workspace index / available
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">Admin workspace</p>
              <h1 className="max-w-3xl [font-family:var(--font-space-grotesk)] text-4xl font-bold leading-[0.96] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Tools &amp; utilities
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Operational utilities, infrastructure monitoring and internal reports, organized for quick access.
              </p>
            </div>
          </div>

          <div className="relative flex min-h-48 items-center justify-center overflow-hidden border-t border-border/70 bg-card/35 p-6 lg:min-h-0 lg:border-l lg:border-t-0">
            <div aria-hidden="true" className="absolute size-64 rounded-full border border-primary/10" />
            <div aria-hidden="true" className="absolute size-44 rounded-full border border-dashed border-primary/20" />
            <div aria-hidden="true" className="absolute size-24 rounded-full border border-primary/25 bg-primary/[0.03]" />
            <div aria-hidden="true" className="absolute h-px w-full bg-border/60" />
            <div aria-hidden="true" className="absolute h-full w-px bg-border/60" />
            <div className="relative z-10 rounded-2xl border border-border/80 bg-background/80 px-8 py-6 text-center shadow-lg">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Available modules</p>
              <p className="mt-2 [font-family:var(--font-space-grotesk)] text-5xl font-bold tabular-nums tracking-tight">{String(totalTools).padStart(2, "0")}</p>
              <div className="mx-auto mt-3 h-px w-10 bg-primary" />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Role-filtered view</p>
            </div>
          </div>
        </header>

        <div className="relative space-y-9 p-4 sm:p-6 lg:p-8">
          <section aria-labelledby="backup-title" className="relative overflow-hidden rounded-2xl border border-teal-600/25 bg-gradient-to-r from-teal-500/10 via-card/70 to-card/45 shadow-sm">
            <div aria-hidden="true" className="absolute -right-16 -top-24 size-64 rounded-full border border-teal-500/15" />
            <div aria-hidden="true" className="absolute -right-6 -top-14 size-44 rounded-full border border-dashed border-teal-500/20" />
            <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
              <div className="flex size-14 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
                <Database className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Featured secure action</p>
                  <span className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Archive .gz</span>
                </div>
                <h2 id="backup-title" className="mt-2 [font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-tight">Database Backup</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Download a compressed logical copy of the database and stored settings.
                </p>
                <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
                  Sensitive data. Store the downloaded file securely. S3 uploads are not included.
                </p>
              </div>
              <Button
                size="lg"
                className="min-h-12 w-full rounded-xl px-6 shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-auto"
                onClick={downloadDatabaseBackup}
                disabled={isBackingUp || !token}
              >
                {isBackingUp ? <Loader2 className="animate-spin" /> : <Download />}
                {isBackingUp ? "Preparing backup..." : "Download backup"}
              </Button>
            </div>
          </section>

          <section aria-labelledby="server-ip-title" className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/45 shadow-sm">
            <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><Globe2 className="size-5" /></div>
                <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Live network identity</p><h2 id="server-ip-title" className="mt-1 font-display text-lg font-bold">Current server IP</h2><p className="mt-1 text-xs text-muted-foreground">Automatically detected from the production backend and refreshed every minute.</p></div>
              </div>
              <div className="text-left sm:text-right">{serverIpLoading ? <p className="font-mono text-sm text-muted-foreground">Detecting...</p> : serverIp ? <><p className="font-mono text-2xl font-bold tracking-wider text-primary">{serverIp.ip}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Updated {new Date(serverIp.checkedAt).toLocaleTimeString()}</p></> : <p className="font-mono text-sm text-amber-600 dark:text-amber-300">{serverIpError ? "Detection unavailable" : "No IP detected"}</p>}</div>
            </div>
          </section>

          <div className="space-y-10">
            {visibleSections.map(section => {
              const SectionIcon = section.icon;
              return (
                <section key={section.label} aria-labelledby={`section-${section.code.slice(0, 2)}`}>
                  <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg border ${section.accentChip}`}>
                      <SectionIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{section.code}</p>
                      <h2 id={`section-${section.code.slice(0, 2)}`} className="truncate [font-family:var(--font-space-grotesk)] text-base font-bold tracking-tight sm:text-lg">
                        {section.label}
                      </h2>
                    </div>
                    <span className="rounded-full border border-border/70 bg-card/55 px-2.5 py-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {String(section.tools.length).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 xl:grid-cols-3">
                    {section.tools.map((tool, index) => {
                      const Icon = tool.icon;
                      const chip = colorMap[tool.color] || colorMap.blue;
                      return (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="group relative flex min-h-52 touch-manipulation flex-col justify-between bg-card/85 p-5 transition-colors hover:bg-accent/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6"
                        >
                          <div>
                            <div className="mb-7 flex items-start justify-between gap-4">
                              <span className={`flex size-11 items-center justify-center rounded-xl border ${chip}`}>
                                <Icon className="size-5" />
                              </span>
                              <span className="font-mono text-[9px] tabular-nums tracking-[0.18em] text-muted-foreground/70">
                                {section.code.slice(0, 2)}.{String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-bold tracking-tight transition-colors group-hover:text-primary">{tool.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                          </div>

                          <div className="mt-7 flex items-center justify-between border-t border-border/70 pt-4">
                            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Open module</span>
                            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary">
                              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <footer className="flex flex-col gap-2 border-t border-border/70 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Workspace tools / {String(totalTools).padStart(2, "0")} available</span>
            <span>Visibility follows account role</span>
          </footer>
        </div>
      </main>
    </PageContainer>
  );
}
