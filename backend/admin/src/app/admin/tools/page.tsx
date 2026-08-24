"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Activity, ArrowUpRight, Bot, CalendarRange, ChartNoAxesCombined, ClipboardList, Cloud, Layers3, Sparkles } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

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
  tools: Tool[];
};

const toolSections: Section[] = [
  {
    label: "Reports & Analytics",
    icon: ChartNoAxesCombined,
    accentChip: "border-blue-400/20 bg-blue-500/10 text-blue-300",
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
    accentChip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
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
    accentChip: "border-violet-400/20 bg-violet-500/10 text-violet-300",
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
  rose: "border-rose-400/20 bg-gradient-to-br from-rose-500/25 to-rose-500/[0.03] text-rose-300",
  blue: "border-blue-400/20 bg-gradient-to-br from-blue-500/25 to-blue-500/[0.03] text-blue-300",
  indigo: "border-indigo-400/20 bg-gradient-to-br from-indigo-500/25 to-indigo-500/[0.03] text-indigo-300",
  cyan: "border-cyan-400/20 bg-gradient-to-br from-cyan-500/25 to-cyan-500/[0.03] text-cyan-300",
  violet: "border-violet-400/20 bg-gradient-to-br from-violet-500/25 to-violet-500/[0.03] text-violet-300",
  emerald: "border-emerald-400/20 bg-gradient-to-br from-emerald-500/25 to-emerald-500/[0.03] text-emerald-300",
  amber: "border-amber-400/20 bg-gradient-to-br from-amber-500/25 to-amber-500/[0.03] text-amber-300",
  green: "border-green-400/20 bg-gradient-to-br from-green-500/25 to-green-500/[0.03] text-green-300",
};

export default function ToolsPage() {
  const { data: session } = useSession();
  const visibleSections = toolSections
    .map(section => ({
      ...section,
      tools: section.tools.filter(tool => !tool.sysadminOnly || session?.user?.role === "sysadmin"),
    }))
    .filter(section => section.tools.length > 0);
  const totalTools = visibleSections.reduce((sum, s) => sum + s.tools.length, 0);

  return (
    <PageContainer>
      <div className="w-full space-y-7 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Workspace Tools</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Admin Utilities</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Operational utilities, infrastructure monitoring and internal reports — all in one place.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-card/60 px-6 py-4 text-right">
            <p className="text-3xl font-bold tabular-nums">{totalTools}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">tools available</p>
          </div>
        </div>

        {/* Tool sections */}
        {visibleSections.map(section => {
          const SectionIcon = section.icon;
          return (
            <section key={section.label}>
              <div className="mb-4 flex items-center gap-3">
                <span className={`flex size-7 items-center justify-center rounded-lg border ${section.accentChip}`}>
                  <SectionIcon className="size-3.5" />
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {section.label}
                </h2>
                <span className="text-[11px] tabular-nums text-muted-foreground">{section.tools.length}</span>
                <div aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {section.tools.map(tool => {
                  const Icon = tool.icon;
                  const chip = colorMap[tool.color] || colorMap.blue;
                  return (
                    <div key={tool.href}>
                      <Link
                        href={tool.href}
                        className="group relative flex min-h-[210px] cursor-pointer flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-card/60 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
                      >
                        <div className="relative">
                          <div
                            className={`mb-5 flex size-12 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${chip}`}
                          >
                            <Icon className="size-5" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold">{tool.title}</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                        </div>

                        <div className="relative mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-xs font-semibold tracking-wide text-primary transition-opacity duration-300 group-hover:opacity-80">
                            Launch tool
                          </span>
                          <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-card/60 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:text-primary">
                            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </PageContainer>
  );
}
