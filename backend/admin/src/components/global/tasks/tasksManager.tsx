/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, List, Plus, Calendar, User as User, MessageSquare, Trash2, ChevronDown, ChevronRight, Settings2, Check, RefreshCw, CheckCircle, Circle, ArrowDownUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useSearchParams, useRouter } from "next/navigation";
import TaskModal from "./TaskModal";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const DueDateDisplay = ({ task, updateTask, className }: { task: any, updateTask: any, className?: string }) => {
  const dateObj = task.dueDate ? new Date(task.dueDate) : null;
  let displayText = "Set Due Date";
  let colorClass = "text-muted-foreground";

  if (dateObj) {
    if (isToday(dateObj)) {
      displayText = "Today";
      colorClass = "text-red-500 font-bold";
    } else if (isTomorrow(dateObj)) {
      displayText = "Tomorrow";
      colorClass = "text-yellow-600 font-bold dark:text-yellow-500";
    } else {
      displayText = format(dateObj, "dd MMM");
      colorClass = "text-muted-foreground font-medium";
    }
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
        <CalendarUI
          mode="single"
          selected={dateObj || undefined}
          onSelect={(date) => updateTask({ id: task._id, data: { dueDate: date } })}
          initialFocus
        />
        <div className="p-2 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
            onClick={() => updateTask({ id: task._id, data: { dueDate: null } })}
          >
            Clear Date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Simple hash function to generate a consistent color index for a given string
const getUserColor = (id: string) => {
  if (!id) return `hsl(0, 0%, 50%)`;
  let hash = 0;
  const str = id.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate a distinct hue from 0 to 360, keeping saturation and lightness constant for vibrant but readable colors
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

export default function TasksManager() {
  const { data: response, isPending, refetch, isFetching } = useTasks();
  const tasks = (response as any)?.tasks || [];
  
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get('taskId');
  const router = useRouter();
  
  const { data: usersData } = useUsers();
  
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false);
  const [sortOption, setSortOption] = useState<"dateDesc" | "dateAsc" | "nameAsc" | "nameDesc">("dateAsc");
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);
  
  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
    setLastSelectedTaskId(id);
  };
  
  const handleTaskSelect = (e: React.MouseEvent, id: string, tasksList: any[]) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.shiftKey && lastSelectedTaskId) {
      const startIdx = tasksList.findIndex((t: any) => t._id === lastSelectedTaskId);
      const endIdx = tasksList.findIndex((t: any) => t._id === id);
      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        const rangeIds = tasksList.slice(min, max + 1).map((t: any) => t._id);
        
        setSelectedTaskIds(prev => {
          const isSelected = prev.includes(id);
          if (isSelected) {
            return prev.filter(tid => !rangeIds.includes(tid));
          } else {
            return Array.from(new Set([...prev, ...rangeIds]));
          }
        });
        setLastSelectedTaskId(id);
        return;
      }
    }
    toggleTaskSelection(id);
  };
  const toggleAllSelection = (tasksList: any[]) => {
    const allSelected = tasksList.every(t => selectedTaskIds.includes(t._id));
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !tasksList.some(t => t._id === id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...tasksList.map(t => t._id)])));
    }
  };
  
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [searchQuery, setSearchQuery] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "PLACED", category: "UNASSIGNED" });

  React.useEffect(() => {
    if (taskIdParam && tasks.length > 0) {
      const task = tasks.find((t: any) => t._id === taskIdParam);
      if (task && (!selectedTask || selectedTask._id !== task._id)) {
        setSelectedTask(task);
      }
    }
    
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find((t: any) => t._id === selectedTask._id);
      if (updatedTask && updatedTask !== selectedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [taskIdParam, tasks, selectedTask]);

  const handleCreateTask = () => {
    if (!newTask.title) {
      toast.error("Title is required");
      return;
    }
    createTask(newTask, {
      onSuccess: () => {
        toast.success("Task created!");
        setIsCreateOpen(false);
        setNewTask({ title: "", description: "", status: "PLACED", category: "UNASSIGNED" });
      }
    });
  };

  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const currentTask = tasks.find((t: any) => t._id === taskId);
    const oldStatus = currentTask?.status;

    setOptimisticStatuses(prev => ({ ...prev, [taskId]: newStatus }));
    updateTask({ id: taskId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast.success("Task details updated!", {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              setOptimisticStatuses(prev => ({ ...prev, [taskId]: oldStatus }));
              updateTask({ id: taskId, data: { status: oldStatus } });
            }
          }
        });
      }
    });
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistically hide the task
    setDeletedTaskIds(prev => [...prev, taskId]);
    let cancelled = false;

    toast.success("Task deleted!", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          cancelled = true;
          setDeletedTaskIds(prev => prev.filter(id => id !== taskId));
        }
      }
    });

    setTimeout(() => {
      if (!cancelled) {
        deleteTask(taskId);
      }
    }, 5000);
  };

  const columns = ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];

  const visibleColumns = columns.filter(s => !hiddenColumns.includes(s));

  // Sort tasks based on selected option
  const sortedTasks = [...tasks]
    .filter((t: any) => !deletedTaskIds.includes(t._id))
    .filter((t: any) => 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerUsername?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // Sort by createdAt only — not statusUpdatedAt — so assignee/dueDate changes never move a task
      if (sortOption === "dateDesc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === "dateAsc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === "nameAsc") return (a.title || "").localeCompare(b.title || "");
      if (sortOption === "nameDesc") return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

  const toggleTaskDone = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask({ id: task._id, data: { isDone: !task.isDone } });
  };

  const toggleColumnVisibility = (status: string) => {
    setHiddenColumns(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleSectionCollapse = (status: string) => {
    setExpandedSections(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleColumnCollapse = (status: string) => {
    setCollapsedColumns(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  if (isPending) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0 overflow-hidden px-1">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 rounded-md"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" /> List View
            </Button>
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 rounded-md"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Board View
            </Button>
          </div>

          {viewMode === "board" && (
            <Popover open={columnsPopoverOpen} onOpenChange={setColumnsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-md gap-2">
                  <Settings2 className="w-4 h-4" />
                  Columns
                  {hiddenColumns.length > 0 && (
                    <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">
                      {visibleColumns.length}/{columns.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-0">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Show / hide columns">
                      {columns.map(status => {
                        const isVisible = !hiddenColumns.includes(status);
                        const count = tasks.filter((t: any) => t.status === status).length;
                        return (
                          <CommandItem
                            key={status}
                            onSelect={() => toggleColumnVisibility(status)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isVisible ? "bg-primary border-primary text-primary-foreground" : "border-border/60"}`}>
                                {isVisible && <Check className="h-3 w-3" />}
                              </span>
                              {status.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <Select value={sortOption} onValueChange={(v: any) => setSortOption(v)}>
            <SelectTrigger className="h-8 px-3 text-sm rounded-md w-40 gap-2 font-medium">
              <ArrowDownUp className="w-4 h-4 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateDesc">Newest First</SelectItem>
              <SelectItem value="dateAsc">Oldest First</SelectItem>
              <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
              <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="rounded-full h-10 w-10 shadow-sm border-slate-200" title="Refresh Tasks">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title</label>
                  <Input placeholder="E.g., Review artwork for Order #123" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Task details..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newTask.category} onValueChange={(v) => setNewTask({...newTask, category: v})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                      <SelectItem value="DIGITAL PRINTING">Digital Printing</SelectItem>
                      <SelectItem value="DISPLAY ITEM">Display Item</SelectItem>
                      <SelectItem value="DIGITAL OFFSET">Digital Offset</SelectItem>
                      <SelectItem value="PREMIUM GIFT">Premium Gift</SelectItem>
                      <SelectItem value="APPAREL">Apparel</SelectItem>
                      <SelectItem value="FRAME">Frame</SelectItem>
                      <SelectItem value="WEDDING PRODUCT">Wedding Product</SelectItem>
                      <SelectItem value="FOOD PACKAGING">Food Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTask} disabled={isCreating} className="w-full">Create Task</Button>
              </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="relative w-full flex-1" style={{minHeight: 'calc(100vh - 200px)'}}>
          <div className="absolute inset-0 overflow-x-auto pb-4">
            <div className="flex gap-4 items-start w-max">
            {visibleColumns.map(status => {
              const columnTasks = sortedTasks.filter((t: any) => t.status === status);
              const isCollapsed = collapsedColumns.includes(status);
              return (
              <div key={status} className="bg-muted/30 rounded-2xl p-3 border border-border/50 flex flex-col gap-3 min-w-[270px] w-[270px] shrink-0">
                <button
                  type="button"
                  onClick={() => toggleColumnCollapse(status)}
                  className="flex items-center gap-2 self-start rounded-full bg-card border border-border/50 shadow-sm pl-3 pr-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span className="font-semibold text-xs uppercase tracking-wider text-foreground/80">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    {columnTasks.length}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                </button>

                {!isCollapsed && (
                <div className="flex flex-col gap-2">
                  {columnTasks.map((task: any) => (
                  <Card key={task._id} className={`cursor-pointer hover:shadow-md transition-shadow group border border-border/50 ${task.isDone ? 'opacity-60 bg-muted/20' : ''}`} onClick={() => setSelectedTask(task)}>
                    <CardContent className="p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div onClick={(e) => handleTaskSelect(e, task._id, columnTasks)} className="cursor-pointer shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center">
                            <Checkbox 
                              checked={selectedTaskIds.includes(task._id)}
                              className="w-full h-full pointer-events-none"
                            />
                          </div>
                          <button type="button" onClick={(e) => toggleTaskDone(task, e)} className="shrink-0 mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors">
                            {task.isDone ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                          </button>
                          <span className={`font-semibold text-sm leading-tight ${task.isDone ? 'text-muted-foreground' : ''}`}>{task.title}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(task._id, e)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {task.comments?.length > 0 && (
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md">
                            <MessageSquare className="w-3 h-3" /> {task.comments.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Interactive Assignee, DueDate, and Status for Board View */}
                      <div className="grid grid-cols-1 gap-1.5" onClick={e => e.stopPropagation()}>
                        <DueDateDisplay task={task} updateTask={updateTask} className="h-6 text-[9px] bg-muted/50 border-0 focus:ring-0" />
                        <Select value={task.assignee || "unassigned"} onValueChange={(v) => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                          <SelectTrigger className="h-6 text-[10px] font-bold bg-muted/50 border-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {usersData?.users?.map((user: any) => (
                              <SelectItem key={user._id} value={user._id} className="font-bold">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(user._id) }} />
                                  {user.name || user.email}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Move Status inline for Board View */}
                      <Select value={optimisticStatuses[task._id] || task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                        <SelectTrigger className="h-6 text-[10px] bg-muted/50 border-0 focus:ring-0" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(s => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
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

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {tasks.length === 0 && (
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-8 text-center text-muted-foreground">
              No tasks found
            </div>
          )}
          {columns.map(status => {
            const sectionTasks = sortedTasks.filter((t: any) => t.status === status);
            if (sectionTasks.length === 0) return null;
            const isCollapsed = !expandedSections.includes(status);
            return (
              <Collapsible key={status} open={!isCollapsed} onOpenChange={() => toggleSectionCollapse(status)} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between gap-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        {status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-background border border-border/50">
                      {sectionTasks.length}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-12 gap-4 p-2 border-b border-border/50 bg-muted/10 font-medium text-xs text-muted-foreground">
                    <div className="col-span-6 px-2 flex items-center gap-2">
                      <Checkbox 
                        checked={sectionTasks.length > 0 && sectionTasks.every((t: any) => selectedTaskIds.includes(t._id))}
                        onCheckedChange={() => toggleAllSelection(sectionTasks)}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      Task Name
                    </div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2 pr-2">Status</div>
                    <div className="col-span-2 pr-4">Due Date</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {sectionTasks.map((task: any) => (
                      <div key={task._id} className="group grid grid-cols-12 gap-2 items-center py-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border/30" onClick={() => setSelectedTask(task)}>
                        <div className="col-span-6 font-medium text-sm flex items-center gap-2 px-2">
                           <div onClick={(e) => handleTaskSelect(e, task._id, sectionTasks)} className="cursor-pointer shrink-0 w-4 h-4 flex items-center justify-center">
                             <Checkbox 
                               checked={selectedTaskIds.includes(task._id)}
                               className="w-full h-full pointer-events-none"
                             />
                           </div>
                           <button type="button" onClick={(e) => toggleTaskDone(task, e)} className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors">
                             {task.isDone ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                           </button>
                           <span className={`truncate ${task.isDone ? 'text-muted-foreground' : ''}`}>{task.title}</span>
                        </div>
                        <div className="col-span-2 text-sm flex items-center gap-2 text-muted-foreground font-bold" onClick={e => e.stopPropagation()}>
                           <Select value={task.assignee || "unassigned"} onValueChange={(v) => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                              <SelectTrigger className="h-8 text-xs bg-transparent border-0 shadow-none focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {usersData?.users?.map((u: any) => (
                                  <SelectItem key={u._id} value={u._id} className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(u._id) }} />
                                      {u.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="col-span-2 pr-2" onClick={e => e.stopPropagation()}>
                          <Select value={optimisticStatuses[task._id] || task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                            <SelectTrigger className="h-8 text-xs bg-transparent border-0 shadow-none focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(s => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 pr-4 text-sm text-muted-foreground flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                           <DueDateDisplay task={task} updateTask={updateTask} className="w-fit" />
                           <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(task._id, e)}>
                             <Trash2 className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/60 backdrop-blur-xl text-foreground shadow-2xl rounded-2xl flex items-center gap-2 p-2 px-4 border border-border/50 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-bold bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-xl mr-2 whitespace-nowrap">
            {selectedTaskIds.length} selected
          </span>
          
          <Select onValueChange={(v) => {
            selectedTaskIds.forEach(id => updateTask({ id, data: { assignee: v === "unassigned" ? null : v } }));
            toast.success(`Assigned ${selectedTaskIds.length} tasks`);
          }}>
            <SelectTrigger className="h-9 bg-transparent border-0 hover:bg-muted/50 focus:ring-0 shadow-none">
              <User className="w-4 h-4 mr-2 opacity-70 shrink-0" /> Assign
            </SelectTrigger>
            <SelectContent className="bg-background/80 backdrop-blur-xl border-border/50">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {usersData?.users?.map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => {
            selectedTaskIds.forEach(id => updateTask({ id, data: { status: v } }));
            toast.success(`Moved ${selectedTaskIds.length} tasks to ${v.replace(/_/g, " ")}`);
          }}>
            <SelectTrigger className="h-9 bg-transparent border-0 hover:bg-muted/50 focus:ring-0 shadow-none">
              <ArrowDownUp className="w-4 h-4 mr-2 opacity-70 shrink-0" /> Status
            </SelectTrigger>
            <SelectContent className="bg-background/80 backdrop-blur-xl border-border/50">
              {columns.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />

          <Button variant="ghost" size="sm" className="hover:bg-emerald-500/10 hover:text-emerald-500" onClick={() => {
            selectedTaskIds.forEach(id => updateTask({ id, data: { isDone: true } }));
            toast.success(`Marked ${selectedTaskIds.length} tasks complete`);
            setSelectedTaskIds([]);
          }}>
            <CheckCircle className="w-4 h-4 mr-2 shrink-0" /> Complete
          </Button>

          <Button variant="ghost" size="sm" className="hover:bg-red-500/10 hover:text-red-500" onClick={() => {
            if (confirm(`Delete ${selectedTaskIds.length} tasks?`)) {
              selectedTaskIds.forEach(id => deleteTask(id));
              setSelectedTaskIds([]);
            }
          }}>
            <Trash2 className="w-4 h-4 mr-2 shrink-0" /> Delete
          </Button>

          <Button variant="ghost" size="icon" className="hover:bg-muted/80 ml-2 rounded-full shrink-0" onClick={() => setSelectedTaskIds([])}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal 
          task={tasks.find((t: any) => t._id === selectedTask._id) || selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => {
            setSelectedTask(null);
            if (taskIdParam) {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('taskId');
              window.history.replaceState(null, '', newUrl.pathname + newUrl.search);
            }
          }} 
        />
      )}
    </div>
  );
}
