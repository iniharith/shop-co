"use client";
import React, { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, List, Plus, Calendar, User as User, MessageSquare, Trash2, ChevronDown, ChevronRight, Settings2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import TaskModal from "./TaskModal";

export default function TasksManager() {
  const { data: response, isPending, refetch, isFetching } = useTasks();
  const tasks = response?.tasks || [];
  
  const { data: usersData } = useUsers();
  
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false);
  
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [newTask, setNewTask] = useState({ title: "", description: "", status: "TODO" });

  const handleCreateTask = () => {
    if (!newTask.title) {
      toast.error("Title is required");
      return;
    }
    createTask(newTask, {
      onSuccess: () => {
        toast.success("Task created!");
        setIsCreateOpen(false);
        setNewTask({ title: "", description: "", status: "TODO" });
      }
    });
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask({ id: taskId, data: { status: newStatus } });
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId, {
        onSuccess: () => toast.success("Task deleted")
      });
    }
  };

  const columns = ['TODO', 'IN_PROGRESS', 'DONE', 'PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEW', 'ARTWORK_REJECTED', 'IN_DESIGN', 'IN_PRODUCTION', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];

  const visibleColumns = columns.filter(s => !hiddenColumns.includes(s));

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
    <div className="flex flex-col gap-6 w-full max-w-[100vw] overflow-hidden px-1">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
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
              <Button onClick={handleCreateTask} disabled={isCreating} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-4 items-start w-max">
            {visibleColumns.map(status => {
              const columnTasks = tasks.filter((t: any) => t.status === status);
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
                  <Card key={task._id} className="cursor-pointer hover:shadow-md transition-shadow group border border-border/50" onClick={() => setSelectedTask(task)}>
                    <CardContent className="p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-xs leading-tight">{task.title}</span>
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
                        <Input 
                          type="date" 
                          value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""} 
                          onChange={e => updateTask({ id: task._id, data: { dueDate: e.target.value ? new Date(e.target.value) : null } })}
                          className="h-6 text-[10px] bg-muted/50 border-0 focus:ring-0 w-full px-2"
                        />
                        <Select value={task.assignee || "unassigned"} onValueChange={(v) => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                          <SelectTrigger className="h-6 text-[10px] font-bold bg-muted/50 border-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)).map((admin: any) => (
                              <SelectItem key={admin._id} value={admin._id} className="font-bold">{admin.name || admin.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Move Status inline for Board View */}
                      <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
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
            const sectionTasks = tasks.filter((t: any) => t.status === status);
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
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/10 font-medium text-xs text-muted-foreground">
                    <div className="col-span-6">Task Name</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {sectionTasks.map((task: any) => (
                      <div key={task._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <div className="col-span-6 font-medium text-sm flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                          {task.title}
                        </div>
                        <div className="col-span-2 text-sm flex items-center gap-2 text-muted-foreground font-bold" onClick={e => e.stopPropagation()}>
                          <Select value={task.assignee || "unassigned"} onValueChange={(v) => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                            <SelectTrigger className="h-8 text-sm font-bold bg-background border border-border/50 shadow-sm focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)).map((admin: any) => (
                                <SelectItem key={admin._id} value={admin._id} className="font-bold">{admin.name || admin.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Input 
                            type="date" 
                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""} 
                            onChange={e => updateTask({ id: task._id, data: { dueDate: e.target.value ? new Date(e.target.value) : null } })}
                            className="h-8 text-xs bg-background border border-border/50 shadow-sm w-full"
                          />
                        </div>
                        <div className="col-span-2" onClick={e => e.stopPropagation()}>
                          <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                            <SelectTrigger className="h-8 text-xs bg-background border border-border/50 shadow-sm focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(s => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
