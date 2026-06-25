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
import TaskModal from "./TaskModal";

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
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500", "bg-sky-500", "bg-lime-500"];
  let hash = 0;
  const str = id.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function TasksManager() {
  const { data: response, isPending, refetch, isFetching } = useTasks();
  const tasks = (response as any)?.tasks || [];
  
  const { data: usersData } = useUsers();
  
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false);
  const [sortOption, setSortOption] = useState<"dateDesc" | "dateAsc" | "nameAsc" | "nameDesc">("dateDesc");
  
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [searchQuery, setSearchQuery] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "PLACED", category: "UNASSIGNED" });

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
          duration: 3000,
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
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId, {
        onSuccess: () => toast.success("Task deleted")
      });
    }
  };

  const columns = ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];

  const visibleColumns = columns.filter(s => !hiddenColumns.includes(s));

  // Sort tasks based on selected option
  const sortedTasks = [...tasks]
    .filter((t: any) => 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerUsername?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortOption === "dateDesc") return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      if (sortOption === "dateAsc") return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
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
    setCollapsedSections(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
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
          <Button 
            variant="secondary" 
            className="rounded-full px-4 shadow-sm"
            onClick={async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/migrate-statuses`);
                const data = await res.json();
                if (data.success) {
                  toast.success(`Migration successful! Refreshed board.`);
                  refetch();
                } else {
                  toast.error(`Migration failed: ${JSON.stringify(data)}`);
                }
              } catch (e) {
                toast.error("Network error during migration");
              }
            }}
          >
            Run Migration Fix
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
        <div className="relative w-full flex-1 min-h-[60vh]">
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
                                  <div className={`w-2 h-2 rounded-full ${getUserColor(user._id)}`} />
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
            const isCollapsed = collapsedSections.includes(status);
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
                    <div className="col-span-6 px-2">Task Name</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2 pr-2">Status</div>
                    <div className="col-span-2 pr-4">Due Date</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {sectionTasks.map((task: any) => (
                      <div key={task._id} className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border/30" onClick={() => setSelectedTask(task)}>
                        <div className="col-span-6 font-medium text-sm flex items-center gap-2 px-2">
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
                                      <div className={`w-2 h-2 rounded-full ${getUserColor(u._id)}`} />
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
                        <div className="col-span-2 pr-4 text-sm text-muted-foreground flex items-center gap-2" onClick={e => e.stopPropagation()}>
                           <DueDateDisplay task={task} updateTask={updateTask} className="w-fit pr-4" />
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal 
          task={tasks.find((t: any) => t._id === selectedTask._id) || selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
