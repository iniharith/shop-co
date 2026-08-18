"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Activity, ArrowUpRight, Bot, ChartNoAxesCombined, ClipboardList, Cloud, Layers3, Sparkles } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

const tools = [
  {
    title: "Website Logs",
    description: "Track successful changes, uploads, deletions and status updates.",
    href: "/admin/tools/audit-log",
    icon: ClipboardList,
    tone: "from-rose-500/20 to-orange-500/5 text-rose-400",
  },
  {
    title: "Staff Reports",
    description: "Sales, orders, storage and operational summaries.",
    href: "/admin/reports",
    icon: ChartNoAxesCombined,
    tone: "from-blue-500/20 to-cyan-500/5 text-blue-400",
  },
  {
    title: "Queue Analytics",
    description: "WIP, throughput, workload and turnaround insights.",
    href: "/admin/queue-analytics",
    icon: Layers3,
    tone: "from-indigo-500/20 to-sky-500/5 text-indigo-400",
  },
  {
    title: "Image Upscale",
    description: "Improve image resolution before artwork production.",
    href: "/admin/tools/upscale",
    icon: Sparkles,
    tone: "from-violet-500/20 to-fuchsia-500/5 text-violet-400",
  },
  {
    title: "Server Status",
    description: "Monitor application health, bandwidth and deployments.",
    href: "/admin/server-status",
    icon: Activity,
    tone: "from-emerald-500/20 to-teal-500/5 text-emerald-400",
  },
  {
    title: "AWS Media Server",
    description: "Review media storage objects and server usage.",
    href: "/admin/aws-media",
    icon: Cloud,
    tone: "from-amber-500/20 to-orange-500/5 text-amber-400",
  },
  {
    title: "Telegram Bot Logs",
    description: "Inspect live Telegram bot activity and responses.",
    href: "/admin/bot-logs",
    icon: Bot,
    tone: "from-green-500/20 to-lime-500/5 text-green-400",
    sysadminOnly: true,
  },
];

export default function ToolsPage() {
  const { data: session } = useSession();
  const visibleTools = tools.filter(tool => !tool.sysadminOnly || session?.user?.role === "sysadmin");

  return (
    <PageContainer>
      <div className="w-full space-y-8 rounded-[28px] border border-white/10 bg-card/40 backdrop-blur-md p-5 shadow-xl md:p-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Admin Utilities</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tools</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            Operational utilities, infrastructure monitoring and internal reports in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleTools.map(tool => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative min-h-56 overflow-hidden rounded-[28px] border border-white/10 bg-card/40 backdrop-blur-md p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${tool.tone.split(" text-")[0]}`} />
                <div className="relative flex h-full flex-col">
                  <div className={`flex size-12 items-center justify-center rounded-2xl bg-background/70 shadow-sm ${tool.tone.split(" ").slice(-1)[0]}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="mt-auto pt-10">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">{tool.title}</h2>
                      <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
