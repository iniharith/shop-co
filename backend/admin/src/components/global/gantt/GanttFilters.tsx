"use client";
import { useState } from "react";
import { useGanttTasks, GanttTask } from "@/hooks/useGanttTasks";
import GanttChart from "@/components/global/gantt/GanttChart";
import { CalendarRange, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, addDays } from "date-fns";

const CATEGORIES = [
  "BANNER", "SIGNBOARD", "POSTER", "FLYER", "BUSINESS_CARDS",
  "STICKER", "TSHIRT", "BROCHURE", "MENU", "PHOTO", "OTHER",
];

const STATUSES = [
  "TODO", "IN_DESIGN", "PEMBETULAN", "PENDING_ARTWORK", "ARTWORK_REVIEWED",
  "IN_PRODUCTION", "DONE_PRINTING", "PRINT_AWB", "PACKAGING", "SHIPPED", "DELIVERED", "COMPLETED",
];

export default function GanttFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: { category?: string; status?: string }) => void;
}) {
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const applyFilters = () => {
    onFilterChange({ category: category || undefined, status: status || undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange size={16} />
        <span className="font-medium">Last 14 days → Next 30 days</span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); }}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={applyFilters}>
          <Filter size={14} className="mr-1" /> Apply
        </Button>
      </div>
    </div>
  );
}
