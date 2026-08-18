"use client";
import { useState } from "react";
import { useGanttTasks } from "@/hooks/useGanttTasks";
import GanttChart from "@/components/global/gantt/GanttChart";
import GanttFilters from "@/components/global/gantt/GanttFilters";
import { CalendarRange } from "lucide-react";

export default function SchedulePage() {
  const [filters, setFilters] = useState<{ category?: string; status?: string }>({});
  const { data: tasks = [], isPending } = useGanttTasks({
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  const filtered = tasks.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.status && t.status !== filters.status) return false;
    return true;
  });

  return (
    <>
      <div className="flex px-4 py-2 items-center gap-3">
        <CalendarRange size={24} className="text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Schedule</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <GanttFilters onFilterChange={setFilters} />
        {isPending ? (
          <div className="h-96 bg-muted/20 animate-pulse rounded-2xl" />
        ) : (
          <GanttChart tasks={filtered} />
        )}
      </div>
    </>
  );
}
