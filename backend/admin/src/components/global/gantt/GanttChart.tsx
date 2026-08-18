"use client";
import { useMemo } from "react";
import { GanttTask } from "@/hooks/useGanttTasks";
import { format, differenceInDays, addDays, isBefore, isAfter, startOfDay } from "date-fns";

interface GanttChartProps {
  tasks: GanttTask[];
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_DESIGN: "bg-violet-500",
  PEMBETULAN: "bg-orange-500",
  PENDING_ARTWORK: "bg-yellow-500",
  ARTWORK_REVIEWED: "bg-blue-500",
  IN_PRODUCTION: "bg-cyan-500",
  DONE_PRINTING: "bg-teal-500",
  PRINT_AWB: "bg-indigo-500",
  PACKAGING: "bg-purple-500",
  SHIPPED: "bg-blue-600",
  DELIVERED: "bg-green-500",
  COMPLETED: "bg-emerald-600",
  CANCELLED: "bg-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_DESIGN: "Design",
  PEMBETULAN: "Correction",
  PENDING_ARTWORK: "Awaiting Art",
  ARTWORK_REVIEWED: "Art Reviewed",
  IN_PRODUCTION: "Production",
  DONE_PRINTING: "Printed",
  PRINT_AWB: "AWB Pending",
  PACKAGING: "Packaging",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ROW_HEIGHT = 36;
const DAY_WIDTH = 40;

export default function GanttChart({ tasks }: GanttChartProps) {
  const { dateRange, gridLines, taskRows } = useMemo(() => {
    const now = new Date();
    const lookback = 14;
    const lookforward = 30;
    const start = addDays(now, -lookback);
    const end = addDays(now, lookforward);
    const totalDays = differenceInDays(end, start) + 1;

    const lines: { date: Date; x: number; isToday: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(start, i);
      lines.push({ date: d, x: i * DAY_WIDTH, isToday: format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") });
    }

    const rows = tasks.map((task) => {
      const taskStart = new Date(task.createdAt);
      const taskEnd = task.completedAt
        ? new Date(task.completedAt)
        : task.dueDate
        ? new Date(task.dueDate)
        : addDays(taskStart, 7);

      const startOffset = Math.max(0, differenceInDays(startOfDay(taskStart), startOfDay(start)));
      const duration = Math.max(1, differenceInDays(startOfDay(taskEnd), startOfDay(taskStart)));

      return { ...task, startOffset, duration };
    });

    return { dateRange: { start, end, totalDays }, gridLines: lines, taskRows: rows };
  }, [tasks]);

  const headerHeight = 50;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900">
      <div style={{ minWidth: dateRange.totalDays * DAY_WIDTH + 250 }}>
        <div className="flex" style={{ height: headerHeight }}>
          <div className="w-[250px] shrink-0 border-b border-r border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-slate-800">
            Task
          </div>
          <div className="relative flex-1 border-b border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-slate-800">
            {gridLines.map((line, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-r border-slate-200/60 dark:border-white/5"
                style={{ left: line.x }}
              >
                <span className={`ml-1 block pt-1.5 text-[10px] leading-none ${line.isToday ? "font-bold text-primary" : "text-slate-400"}`}>
                  {format(line.date, "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {taskRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No tasks to display</div>
        ) : (
          taskRows.map((task) => (
            <div key={task.id} className="flex border-b border-slate-100 dark:border-white/5" style={{ height: ROW_HEIGHT }}>
              <div className="w-[250px] shrink-0 border-r border-slate-200/80 px-3 flex items-center gap-2 dark:border-white/10">
                <span className="text-xs font-medium truncate max-w-[180px]">{task.title}</span>
                {task.assignee && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                    {task.assignee.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="relative flex-1">
                <div
                  className={`absolute top-2 h-5 rounded-full ${STATUS_COLORS[task.status] || "bg-gray-400"} opacity-85 cursor-pointer hover:opacity-100 transition-opacity`}
                  style={{ left: task.startOffset * DAY_WIDTH + 2, width: Math.max(task.duration * DAY_WIDTH - 4, 8) }}
                  title={`${task.title} — ${STATUS_LABELS[task.status] || task.status}`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
