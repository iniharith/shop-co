"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Activity, ArrowUpRight, Bot, CalendarRange, ChartNoAxesCombined, ClipboardList, Cloud, Layers3, Sparkles, Wrench } from "lucide-react";
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
  accent: { chip: string; line: string };
  tools: Tool[];
};

const toolSections: Section[] = [
  {
    label: "Reports & Analytics",
    icon: ChartNoAxesCombined,
    accent: {
      chip: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      line: "from-blue-400/30",
    },
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
    accent: {
      chip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      line: "from-emerald-400/30",
    },
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
    accent: {
      chip: "border-violet-400/20 bg-violet-500/10 text-violet-300",
      line: "from-violet-400/30",
    },
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

const colorMap: Record<string, { chip: string; text: string; glow: string; line: string }> = {
  rose: {
    chip: "border-rose-400/20 bg-gradient-to-br from-rose-500/25 to-rose-500/[0.03] text-rose-300",
    text: "text-rose-300/90",
    glow: "bg-rose-500",
    line: "via-rose-400/50",
  },
  blue: {
    chip: "border-blue-400/20 bg-gradient-to-br from-blue-500/25 to-blue-500/[0.03] text-blue-300",
    text: "text-blue-300/90",
    glow: "bg-blue-500",
    line: "via-blue-400/50",
  },
  indigo: {
    chip: "border-indigo-400/20 bg-gradient-to-br from-indigo-500/25 to-indigo-500/[0.03] text-indigo-300",
    text: "text-indigo-300/90",
    glow: "bg-indigo-500",
    line: "via-indigo-400/50",
  },
  cyan: {
    chip: "border-cyan-400/20 bg-gradient-to-br from-cyan-500/25 to-cyan-500/[0.03] text-cyan-300",
    text: "text-cyan-300/90",
    glow: "bg-cyan-500",
    line: "via-cyan-400/50",
  },
  violet: {
    chip: "border-violet-400/20 bg-gradient-to-br from-violet-500/25 to-violet-500/[0.03] text-violet-300",
    text: "text-violet-300/90",
    glow: "bg-violet-500",
    line: "via-violet-400/50",
  },
  emerald: {
    chip: "border-emerald-400/20 bg-gradient-to-br from-emerald-500/25 to-emerald-500/[0.03] text-emerald-300",
    text: "text-emerald-300/90",
    glow: "bg-emerald-500",
    line: "via-emerald-400/50",
  },
  amber: {
    chip: "border-amber-400/20 bg-gradient-to-br from-amber-500/25 to-amber-500/[0.03] text-amber-300",
    text: "text-amber-300/90",
    glow: "bg-amber-500",
    line: "via-amber-400/50",
  },
  green: {
    chip: "border-green-400/20 bg-gradient-to-br from-green-500/25 to-green-500/[0.03] text-green-300",
    text: "text-green-300/90",
    glow: "bg-green-500",
    line: "via-green-400/50",
  },
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

  let cardIndex = 0;

  return (
    <PageContainer>
      <div className="font-sans text-white h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        <div className="relative min-h-full rounded-3xl p-4 md:p-8">
          {/* Aurora backdrop — gives the frosted cards something to blur */}
          <div aria-hidden className="tools-aurora pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="animate-drift absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-blue-600/35 blur-[130px]"
              style={{ animationDuration: "22s" }}
            />
            <div
              className="animate-drift absolute top-1/4 -right-48 h-[38rem] w-[38rem] rounded-full bg-violet-600/30 blur-[150px]"
              style={{ animationDuration: "26s", animationDelay: "-8s" }}
            />
            <div
              className="animate-drift absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-emerald-600/30 blur-[140px]"
              style={{ animationDuration: "24s", animationDelay: "-14s" }}
            />
            <div
              className="animate-drift absolute bottom-1/3 right-1/4 size-96 rounded-full bg-rose-500/25 blur-[120px]"
              style={{ animationDuration: "20s", animationDelay: "-5s" }}
            />
            <div
              className="animate-drift absolute top-10 left-1/2 size-80 rounded-full bg-cyan-500/25 blur-[110px]"
              style={{ animationDuration: "28s", animationDelay: "-11s" }}
            />
            {/* Subtle grid texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          </div>

          {/* Hero header */}
          <div className="animate-rise-in relative z-10 mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-blue-400" />
                </span>
                All Systems Operational
              </span>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                  <Wrench className="size-5 text-gray-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Admin{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                    Utilities
                  </span>
                </h1>
              </div>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
                Operational utilities, infrastructure monitoring and internal reports — all in one place.
              </p>
            </div>

            <div className="hidden shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-right backdrop-blur-xl md:block">
              <p className="text-3xl font-semibold tabular-nums">{totalTools}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-gray-500">tools available</p>
            </div>
          </div>

          {/* Frosted glass tool sections */}
          <div className="relative z-10 space-y-10">
            {visibleSections.map(section => {
              const SectionIcon = section.icon;
              return (
                <section key={section.label}>
                  {/* Section header */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`flex size-7 items-center justify-center rounded-lg border backdrop-blur-md ${section.accent.chip}`}
                    >
                      <SectionIcon className="size-3.5" />
                    </span>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">{section.label}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tabular-nums text-gray-500">
                      {section.tools.length}
                    </span>
                    <div
                      aria-hidden
                      className={`h-px flex-1 bg-gradient-to-r to-transparent ${section.accent.line}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {section.tools.map(tool => {
                      const Icon = tool.icon;
                      const c = colorMap[tool.color] || colorMap.blue;
                      const delay = 80 + cardIndex++ * 70;
                      return (
                        <div
                          key={tool.href}
                          className="animate-rise-in"
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          <Link
                            href={tool.href}
                            className="group relative flex min-h-[210px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/45 p-6 shadow-elevation-dark backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
                          >
                            {/* Colored glow revealed on hover */}
                            <div
                              aria-hidden
                              className={`pointer-events-none absolute -top-20 -right-20 size-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30 ${c.glow}`}
                            />
                            {/* Gradient hairline on top edge */}
                            <div
                              aria-hidden
                              className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-70 ${c.line}`}
                            />

                            <div className="relative">
                              <div
                                className={`mb-5 flex size-12 items-center justify-center rounded-2xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ${c.chip}`}
                              >
                                <Icon className="size-5" />
                              </div>
                              <h3 className="mb-2 text-lg font-semibold text-white">{tool.title}</h3>
                              <p className="text-sm leading-relaxed text-gray-400">{tool.description}</p>
                            </div>

                            <div className="relative mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                              <span
                                className={`text-xs font-semibold tracking-wide transition-opacity duration-300 ${c.text} opacity-75 group-hover:opacity-100`}
                              >
                                Launch tool
                              </span>
                              <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
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
        </div>
      </div>
    </PageContainer>
  );
}
