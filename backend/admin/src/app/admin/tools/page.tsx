"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Activity, ArrowUpRight, Bot, CalendarRange, ChartNoAxesCombined, ClipboardList, Cloud, Layers3, Sparkles } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

const tools = [
  {
    title: "Website Logs",
    description: "Track successful changes, uploads, deletions and status updates.",
    href: "/admin/tools/audit-log",
    icon: ClipboardList,
    color: "rose",
  },
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
  {
    title: "Image Upscale",
    description: "Improve image resolution before artwork production.",
    href: "/admin/tools/upscale",
    icon: Sparkles,
    color: "violet",
  },
  {
    title: "Server Status",
    description: "Monitor application health, bandwidth and deployments.",
    href: "/admin/server-status",
    icon: Activity,
    color: "emerald",
  },
  {
    title: "AWS Media Server",
    description: "Review media storage objects and server usage.",
    href: "/admin/aws-media",
    icon: Cloud,
    color: "amber",
  },
  {
    title: "Telegram Bot Logs",
    description: "Inspect live Telegram bot activity and responses.",
    href: "/admin/bot-logs",
    icon: Bot,
    color: "green",
    sysadminOnly: true,
  },
];

const colorMap: Record<string, { bg: string; icon: string; dot: string; hover: string }> = {
  rose:    { bg: "bg-rose-500/10 border-rose-500/20",    icon: "bg-rose-500/15 text-rose-400",    dot: "bg-rose-400",    hover: "hover:border-rose-500/30" },
  blue:    { bg: "bg-blue-500/10 border-blue-500/20",    icon: "bg-blue-500/15 text-blue-400",    dot: "bg-blue-400",    hover: "hover:border-blue-500/30" },
  indigo:  { bg: "bg-indigo-500/10 border-indigo-500/20", icon: "bg-indigo-500/15 text-indigo-400", dot: "bg-indigo-400",  hover: "hover:border-indigo-500/30" },
  cyan:    { bg: "bg-cyan-500/10 border-cyan-500/20",    icon: "bg-cyan-500/15 text-cyan-400",    dot: "bg-cyan-400",    hover: "hover:border-cyan-500/30" },
  violet:  { bg: "bg-violet-500/10 border-violet-500/20", icon: "bg-violet-500/15 text-violet-400", dot: "bg-violet-400",  hover: "hover:border-violet-500/30" },
  emerald: { bg: "bg-emerald-500/10 border-emerald-500/20", icon: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400", hover: "hover:border-emerald-500/30" },
  amber:   { bg: "bg-amber-500/10 border-amber-500/20",   icon: "bg-amber-500/15 text-amber-400",  dot: "bg-amber-400",   hover: "hover:border-amber-500/30" },
  green:   { bg: "bg-green-500/10 border-green-500/20",   icon: "bg-green-500/15 text-green-400",  dot: "bg-green-400",   hover: "hover:border-green-500/30" },
};

export default function ToolsPage() {
  const { data: session } = useSession();
  const visibleTools = tools.filter(tool => !tool.sysadminOnly || session?.user?.role === "sysadmin");

  return (
    <PageContainer>
      <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap items-center space-x-2 md:space-x-6">
            <div className="flex items-center text-white font-bold text-xl mr-4">
              <Activity className="w-6 h-6 mr-2" />
            </div>
            <div className="flex flex-wrap gap-2 md:space-x-4 text-xs md:text-sm font-medium text-gray-500">
              <span className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>All Tools
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Utilities</h1>
            <p className="mt-2 text-sm text-gray-500">
              Operational utilities, infrastructure monitoring and internal reports in one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleTools.map(tool => {
            const Icon = tool.icon;
            const c = colorMap[tool.color] || colorMap.blue;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group ${c.bg} border rounded-[28px] p-6 flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:-translate-y-1 ${c.hover} hover:shadow-xl cursor-pointer relative overflow-hidden`}
              >
                {/* Decorative dot */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${c.dot} opacity-60`} />

                <div>
                  <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center mb-5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2">{tool.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.bg} flex items-center gap-1.5`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></div>
                    Open
                  </span>
                  <ArrowUpRight className="size-4 text-gray-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
