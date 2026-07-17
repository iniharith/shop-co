"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutGrid, List, Plus, Calendar, MessageSquare, Trash2,
  ChevronDown, ChevronRight, Settings2, Check, RefreshCw,
  CheckCircle, Circle, ArrowDownUp, X, UserCheck, CalendarClock, Layers,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import TaskModal from "./TaskModal";
// Centralized in @/lib/userColor so every place a user shows up (board, list,
// task detail modal, anywhere else) uses the exact same persistent per-ID
// color instead of each component deriving its own.
import { getUserColor, AssigneeTag } from "@/lib/userColor";
import LoadingAnimation from "@/components/global/LoadingAnimation";

// ─── Due Date Display ─────────────────────────────────────────────────────────
const DueDateDisplay = ({ task, updateTask, className }: { task: any; updateTask: any; className?: string }) => {
  const dateObj = task.dueDate ? new Date(task.dueDate) : null;
  let displayText = "Set Due Date";
  let colorClass = "text-muted-foreground";

  if (dateObj) {
    if (isToday(dateObj)) { displayText = "Today"; colorClass = "text-red-500 font-bold"; }
    else if (isTomorrow(dateObj)) { displayText = "Tomorrow"; colorClass = "text-yellow-600 font-bold dark:text-yellow-500"; }
    else { displayText = format(dateObj, "dd MMM"); colorClass = "text-muted-foreground font-medium"; }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`px-2 w-full justify-start hover:bg-muted/50 ${colorClass} ${className}`}>
          <Calendar className="w-3 h-3 mr-1 shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarUI mode="single" selected={dateObj || undefined} onSelect={(date) => updateTask({ id: task._id, data: { dueDate: date } })} initialFocus />
        <div className="p-2 border-t border-border/50">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => updateTask({ id: task._id, data: { dueDate: null } })}>
            Clear Date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── Task status columns ───────────────────────────────────────────────────────
// Hoisted to module scope so it can be used as the initial (default-closed)
// value for collapsedSections below, before the component's other state exists.
const TASK_COLUMNS = [
  'PLACED','IN_PROGRESS','PENDING_ARTWORK','ARTWORK_REVIEWED','ARTWORK_REJECTED',
  'IN_DESIGN','PEMBETULAN','DONE_DESIGN','IN_PRODUCTION','HOLD_PRINTING',
  'DONE_PRINTING','PACKAGING','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED','FAILED',
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TasksManager() {
  const { data: response, isPending, refetch, isFetching } = useTasks();
  const tasks = (response as any)?.tasks || [];
  const { data: usersData } = useUsers();

  const [viewMode, setViewMode]                     = useState<"board" | "list">("board");
  const [isCreateOpen, setIsCreateOpen]             = useState(false);
  const [selectedTask, setSelectedTask]             = useState<any>(null);
  const [hiddenColumns, setHiddenColumns]           = useState<string[]>([]);
  // Sections start closed (all statuses "collapsed") — matches the previous
  // behaviour where you had to click a section to open it, instead of every
  // section dropping open the moment the Tasks page loads.
  const [collapsedSections, setCollapsedSections]   = useState<string[]>(TASK_COLUMNS);
  const [collapsedColumns, setCollapsedColumns]     = useState<string[]>([]);
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false);
  const [sortOption, setSortOption]                 = useState<"dateDesc"|"dateAsc"|"nameAsc"|"nameDesc">("dateDesc");
  const [deletedTaskIds, setDeletedTaskIds]         = useState<string[]>([]);
  const [searchQuery, setSearchQuery]               = useState("");
  const [newTask, setNewTask]                       = useState({ title: "", description: "", status: "PLACED", category: "UNASSIGNED" });

  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask }  = useUpdateTask();
  const { mutate: deleteTask }  = useDeleteTask();

  // ── Asana-style multi-select ──────────────────────────────────────────────
  // No checkboxes. Click a row to open it. Shift+click to add to selection.
  // Clicking outside any row clears the selection.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIdRef              = useRef<string | null>(null);

  // Pressing Escape clears selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedIds(new Set()); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Flat ordered list used for shift-click range selection (list view only).
  // Keep this stable — it's the same order the rows are rendered in.
  const flatOrderedIds: string[] = [];

  const handleRowClick = useCallback(
    (task: any, e: React.MouseEvent, orderedIds: string[]) => {
      if (e.shiftKey) {
        e.preventDefault(); // prevent text highlight
        const last = lastClickedIdRef.current;
        if (last && orderedIds.includes(last) && orderedIds.includes(task._id)) {
          const a = orderedIds.indexOf(last);
          const b = orderedIds.indexOf(task._id);
          const [start, end] = a < b ? [a, b] : [b, a];
          const range = orderedIds.slice(start, end + 1);
          setSelectedIds(prev => {
            const next = new Set(prev);
            range.forEach(id => next.add(id));
            return next;
          });
        } else {
          // No prior anchor — just toggle this one
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(task._id) ? next.delete(task._id) : next.add(task._id);
            return next;
          });
        }
        lastClickedIdRef.current = task._id;
      } else if (selectedIds.size > 0) {
        // Selection mode active — single click toggles without opening modal
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.has(task._id) ? next.delete(task._id) : next.add(task._id);
          return next;
        });
        lastClickedIdRef.current = task._id;
      } else {
        // Normal click — open modal
        setSelectedTask(task);
        lastClickedIdRef.current = task._id;
      }
    },
    [selectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIdRef.current = null;
  }, []);

  const applyBulkUpdate = useCallback((data: Record<string, any>) => {
    const ids = Array.from(selectedIds);
    ids.forEach(id => updateTask({ id, data }));
    toast.success(`Updated ${ids.length} task${ids.length > 1 ? "s" : ""}`);
    clearSelection();
  }, [selectedIds, updateTask, clearSelection]);

  // ── Bulk toolbar popover state ────────────────────────────────────────────
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkDateOpen,   setBulkDateOpen]   = useState(false);

  // ── Standard handlers ─────────────────────────────────────────────────────
  const handleCreateTask = () => {
    if (!newTask.title) { toast.error("Title is required"); return; }
    createTask(newTask, {
      onSuccess: () => {
        toast.success("Task created!");
        setIsCreateOpen(false);
        setNewTask({ title: "", description: "", status: "PLACED", category: "UNASSIGNED" });
      },
    });
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const old = tasks.find((t: any) => t._id === taskId)?.status;
    updateTask({ id: taskId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast.success("Status updated!", {
          duration: 5000,
          action: { label: "Undo", onClick: () => updateTask({ id: taskId, data: { status: old } }) },
        });
      },
    });
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletedTaskIds(prev => [...prev, taskId]);
    let cancelled = false;
    toast.success("Task deleted!", {
      duration: 5000,
      action: { label: "Undo", onClick: () => { cancelled = true; setDeletedTaskIds(prev => prev.filter(id => id !== taskId)); } },
    });
    setTimeout(() => { if (!cancelled) deleteTask(taskId); }, 5000);
  };

  const toggleTaskDone = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask({ id: task._id, data: { isDone: !task.isDone } });
  };

  // ── Columns / visibility ──────────────────────────────────────────────────
  const columns = TASK_COLUMNS;
  const visibleColumns = columns.filter(s => !hiddenColumns.includes(s));

  const toggleColumnVisibility = (s: string) => setHiddenColumns(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSectionCollapse  = (s: string) => setCollapsedSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleColumnCollapse   = (s: string) => setCollapsedColumns(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // ── Sorted / filtered task list ───────────────────────────────────────────
  const sortedTasks = [...tasks]
    .filter((t: any) => !deletedTaskIds.includes(t._id))
    .filter((t: any) =>
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerUsername?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortOption === "dateDesc") return new Date(b.statusUpdatedAt || b.createdAt).getTime() - new Date(a.statusUpdatedAt || a.createdAt).getTime();
      if (sortOption === "dateAsc")  return new Date(a.statusUpdatedAt || a.createdAt).getTime() - new Date(b.statusUpdatedAt || b.createdAt).getTime();
      if (sortOption === "nameAsc")  return (a.title || "").localeCompare(b.title || "");
      if (sortOption === "nameDesc") return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

  // Build a flat ordered list of all list-view task IDs (for shift-click range)
  // This runs during render so it always reflects the current sort/filter order.
  const listOrderedIds: string[] = [];
  columns.forEach(status => {
    sortedTasks.filter((t: any) => t.status === status).forEach((t: any) => listOrderedIds.push(t._id));
  });

  if (isPending) return <LoadingAnimation fullScreen={false} label="Loading tasks" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0 overflow-hidden px-1">

      {/* ── Top Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
            <Button variant={viewMode === "list"  ? "secondary" : "ghost"} size="sm" className="h-8 px-3 rounded-md" onClick={() => { setViewMode("list");  clearSelection(); }}>
              <List className="w-4 h-4 mr-2" /> List View
            </Button>
            <Button variant={viewMode === "board" ? "secondary" : "ghost"} size="sm" className="h-8 px-3 rounded-md" onClick={() => { setViewMode("board"); clearSelection(); }}>
              <LayoutGrid className="w-4 h-4 mr-2" /> Board View
            </Button>
          </div>

          {/* Column visibility (board only) */}
          {viewMode === "board" && (
            <Popover open={columnsPopoverOpen} onOpenChange={setColumnsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-md gap-2">
                  <Settings2 className="w-4 h-4" /> Columns
                  {hiddenColumns.length > 0 && <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">{visibleColumns.length}/{columns.length}</Badge>}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-0">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Show / hide columns">
                      {columns.map(status => {
                        const isVisible = !hiddenColumns.includes(status);
                        return (
                          <CommandItem key={status} onSelect={() => toggleColumnVisibility(status)} className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isVisible ? "bg-primary border-primary text-primary-foreground" : "border-border/60"}`}>
                                {isVisible && <Check className="h-3 w-3" />}
                              </span>
                              {status.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">{tasks.filter((t: any) => t.status === status).length}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v: any) => setSortOption(v)}>
            <SelectTrigger className="h-8 px-3 text-sm rounded-md w-40 gap-2 font-medium">
              <ArrowDownUp className="w-4 h-4 shrink-0" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateDesc">Newest First</SelectItem>
              <SelectItem value="dateAsc">Oldest First</SelectItem>
              <SelectItem value="nameAsc">Name (A–Z)</SelectItem>
              <SelectItem value="nameDesc">Name (Z–A)</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Search tasks…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-8 w-48 text-sm" />

          {/* Hint — only visible in list view when nothing is selected */}
          {viewMode === "list" && selectedIds.size === 0 && (
            <span className="text-xs text-muted-foreground hidden md:inline select-none">
              Shift+click rows to select multiple
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="rounded-full h-10 w-10 shadow-sm border-slate-200" title="Refresh">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="secondary" className="rounded-full px-4 shadow-sm" onClick={async () => {
            try {
              const res  = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/migrate-statuses`);
              const data = await res.json();
              data.success ? toast.success("Migration successful!") && refetch() : toast.error(`Migration failed: ${JSON.stringify(data)}`);
            } catch { toast.error("Network error during migration"); }
          }}>
            Run Migration Fix
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title</label>
                  <Input placeholder="E.g., Review artwork for Order #123" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Task details…" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newTask.category} onValueChange={v => setNewTask({ ...newTask, category: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {["UNASSIGNED","DIGITAL PRINTING","DISPLAY ITEM","DIGITAL OFFSET","PREMIUM GIFT","APPAREL","FRAME","WEDDING PRODUCT","FOOD PACKAGING"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTask} disabled={isCreating} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Board View ──────────────────────────────────────────────────── */}
      {viewMode === "board" && (
        <div className="relative w-full flex-1" style={{ minHeight: "calc(100vh - 200px)" }}>
          <div className="absolute inset-0 overflow-x-auto pb-4">
            <div className="flex gap-4 items-start w-max">
              {visibleColumns.map(status => {
                const columnTasks = sortedTasks.filter((t: any) => t.status === status);
                const isCollapsed = collapsedColumns.includes(status);
                return (
                  <div key={status} className="bg-muted/30 rounded-2xl p-3 border border-border/50 flex flex-col gap-3 min-w-[270px] w-[270px] shrink-0">
                    <button type="button" onClick={() => toggleColumnCollapse(status)} className="flex items-center gap-2 self-start rounded-full bg-card border border-border/50 shadow-sm pl-3 pr-2 py-1.5 hover:bg-muted/60 transition-colors">
                      <span className="font-semibold text-xs uppercase tracking-wider text-foreground/80">{status.replace(/_/g, " ")}</span>
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">{columnTasks.length}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    {!isCollapsed && (
                      <div className="flex flex-col gap-2">
                        {columnTasks.map((task: any) => (
                          <Card key={task._id} className={`cursor-pointer hover:shadow-md transition-shadow group border border-border/50 ${task.isDone ? "opacity-60 bg-muted/20" : ""}`} onClick={() => setSelectedTask(task)}>
                            <CardContent className="p-3 flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  <button type="button" onClick={e => toggleTaskDone(task, e)} className="shrink-0 mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors">
                                    {task.isDone ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                                  </button>
                                  <span className={`font-semibold text-sm leading-tight ${task.isDone ? "text-muted-foreground" : ""}`}>{task.title}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={e => handleDelete(task._id, e)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              {task.comments?.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md w-fit">
                                  <MessageSquare className="w-3 h-3" /> {task.comments.length}
                                </span>
                              )}
                              <div className="grid grid-cols-1 gap-1.5" onClick={e => e.stopPropagation()}>
                                <DueDateDisplay task={task} updateTask={updateTask} className="h-6 text-[9px] bg-muted/50 border-0 focus:ring-0" />
                                <Select value={task.assignee || "unassigned"} onValueChange={v => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                                  <SelectTrigger className="h-6 text-[10px] font-bold bg-muted/50 border-0 focus:ring-0">
                                    <AssigneeTag user={usersData?.users?.find((u: any) => u._id === task.assignee)} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {usersData?.users?.map((u: any) => (
                                      <SelectItem key={u._id} value={u._id}><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(u._id) }} />{u.name || u.email}</div></SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Select value={task.status} onValueChange={v => handleStatusChange(task._id, v)}>
                                <SelectTrigger className="h-6 text-[10px] bg-muted/50 border-0 focus:ring-0" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                <SelectContent>{columns.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                              </Select>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4" onClick={e => {
          // Clicking the list container background (not a row) clears selection
          if ((e.target as HTMLElement).closest("[data-task-row]")) return;
          clearSelection();
        }}>
          {tasks.length === 0 && (
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-8 text-center text-muted-foreground">No tasks found</div>
          )}
          {columns.map(status => {
            const sectionTasks = sortedTasks.filter((t: any) => t.status === status);
            if (sectionTasks.length === 0) return null;
            const isCollapsed = collapsedSections.includes(status);
            return (
              <Collapsible key={status} open={!isCollapsed} onOpenChange={() => toggleSectionCollapse(status)} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between gap-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{status.replace(/_/g, " ")}</span>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-background border border-border/50">{sectionTasks.length}</Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border/50 bg-muted/10 font-medium text-xs text-muted-foreground select-none">
                    <div className="col-span-6 px-2">Task Name</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Due Date</div>
                  </div>
                  {/* Task rows */}
                  <div className="divide-y divide-border/50">
                    {sectionTasks.map((task: any) => {
                      const isSelected = selectedIds.has(task._id);
                      return (
                        <div
                          key={task._id}
                          data-task-row="true"
                          className={`
                            group grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-lg
                            transition-all cursor-pointer select-none
                            ${isSelected
                              ? "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500 ring-inset"
                              : "border border-transparent hover:bg-muted/30 hover:border-border/30"
                            }
                          `}
                          onClick={e => handleRowClick(task, e, listOrderedIds)}
                        >
                          {/* Left accent bar when selected */}
                          <div className={`col-span-6 font-medium text-sm flex items-center gap-2 px-2 relative`}>
                            {isSelected && (
                              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-full" />
                            )}
                            <button
                              type="button"
                              onClick={e => toggleTaskDone(task, e)}
                              className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
                            >
                              {task.isDone
                                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                : <Circle className={`w-5 h-5 ${isSelected ? "text-blue-500" : ""}`} />
                              }
                            </button>
                            <span className={`truncate ${task.isDone ? "text-muted-foreground" : ""} ${isSelected ? "text-blue-700 dark:text-blue-300 font-semibold" : ""}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="col-span-2 text-sm" onClick={e => e.stopPropagation()}>
                            <Select value={task.assignee || "unassigned"} onValueChange={v => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                              <SelectTrigger className="h-8 text-xs bg-transparent border-0 shadow-none focus:ring-0">
                                <AssigneeTag user={usersData?.users?.find((u: any) => u._id === task.assignee)} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {usersData?.users?.map((u: any) => (
                                  <SelectItem key={u._id} value={u._id}>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(u._id) }} />{u.name}</div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2" onClick={e => e.stopPropagation()}>
                            <Select value={task.status} onValueChange={v => handleStatusChange(task._id, v)}>
                              <SelectTrigger className="h-8 text-xs bg-transparent border-0 shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                              <SelectContent>{columns.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                            <DueDateDisplay task={task} updateTask={updateTask} className="w-fit" />
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                              onClick={e => handleDelete(task._id, e)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* ── Task Detail Modal ────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskModal
          task={tasks.find((t: any) => t._id === selectedTask._id) || selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* ── Floating Bulk Action Toolbar ─────────────────────────────────────
          Rendered via portal directly on document.body so it escapes the
          ScrollArea's overflow clipping that would otherwise hide it.
      ─────────────────────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1 bg-card border border-border shadow-2xl rounded-2xl px-3 py-2 animate-in slide-in-from-bottom-3 duration-150">

          {/* Count */}
          <span className="text-sm font-semibold text-foreground px-2 mr-1">
            {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected
          </span>

          <div className="w-px h-5 bg-border mx-1" />

          {/* ── Assign ── */}
          <Popover open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium h-8 px-3 rounded-lg">
                <UserCheck className="w-3.5 h-3.5" /> Assign
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="center" side="top" sideOffset={10}>
              <div className="flex flex-col">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-muted-foreground w-full text-left"
                  onClick={() => { applyBulkUpdate({ assignee: null }); setBulkAssignOpen(false); }}
                >
                  Unassigned
                </button>
                {usersData?.users?.map((u: any) => (
                  <button
                    key={u._id}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full text-left"
                    onClick={() => { applyBulkUpdate({ assignee: u._id }); setBulkAssignOpen(false); }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(u._id) }} />
                    {u.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* ── Set Status ── */}
          <Popover open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium h-8 px-3 rounded-lg">
                <Layers className="w-3.5 h-3.5" /> Set Status
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1 max-h-72 overflow-y-auto" align="center" side="top" sideOffset={10}>
              <div className="flex flex-col">
                {columns.map(s => (
                  <button
                    key={s}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors w-full text-left"
                    onClick={() => { applyBulkUpdate({ status: s }); setBulkStatusOpen(false); }}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* ── Due Date ── */}
          <Popover open={bulkDateOpen} onOpenChange={setBulkDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium h-8 px-3 rounded-lg">
                <CalendarClock className="w-3.5 h-3.5" /> Due Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="top" sideOffset={10}>
              <CalendarUI
                mode="single"
                onSelect={date => { if (date) { applyBulkUpdate({ dueDate: date }); setBulkDateOpen(false); } }}
                initialFocus
              />
              <div className="p-2 border-t border-border/50">
                <Button
                  variant="ghost" size="sm"
                  className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  onClick={() => { applyBulkUpdate({ dueDate: null }); setBulkDateOpen(false); }}
                >
                  Clear Date
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 bg-border mx-1" />

          {/* ── Dismiss ── */}
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={clearSelection}
            title="Clear selection (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>,
        document.body
      )}
    </div>
  );
}
