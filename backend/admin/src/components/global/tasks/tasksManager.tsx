"use client";
import React, { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, List, Plus, Calendar, User as UserIcon, MessageSquare, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import TaskModal from "./TaskModal";

export default function TasksManager() {
  const { data: response, isPending } = useTasks();
  const tasks = response?.tasks || [];
  
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
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

  const columns = ["TODO", "IN_PROGRESS", "DONE"];

  if (isPending) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="flex flex-col gap-6">
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
        </div>
        
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

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map(status => (
            <div key={status} className="bg-muted/30 rounded-2xl p-4 border border-border/50 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {status.replace("_", " ")}
                </h3>
                <Badge variant="secondary" className="rounded-full bg-background border border-border/50">
                  {tasks.filter((t: any) => t.status === status).length}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-3">
                {tasks.filter((t: any) => t.status === status).map((task: any) => (
                  <Card key={task._id} className="cursor-pointer hover:shadow-md transition-shadow group border border-border/50" onClick={() => setSelectedTask(task)}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-sm leading-tight">{task.title}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(task._id, e)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                            <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "MMM d")}
                          </span>
                        )}
                        {task.comments?.length > 0 && (
                          <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                            <MessageSquare className="w-3 h-3" /> {task.comments.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Move Status inline for Board View */}
                      <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                        <SelectTrigger className="h-7 text-xs bg-muted/50 border-0 focus:ring-0" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/30 font-medium text-sm text-muted-foreground">
            <div className="col-span-6">Task Name</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Status</div>
          </div>
          <div className="divide-y divide-border/50">
            {tasks.length === 0 && <div className="p-8 text-center text-muted-foreground">No tasks found</div>}
            {tasks.map((task: any) => (
              <div key={task._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedTask(task)}>
                <div className="col-span-6 font-medium text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  {task.title}
                </div>
                <div className="col-span-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4" /> {task.assignee ? "Assigned" : "Unassigned"}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "-"}
                </div>
                <div className="col-span-2" onClick={e => e.stopPropagation()}>
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                    <SelectTrigger className="h-8 text-xs bg-background border border-border/50 shadow-sm focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
