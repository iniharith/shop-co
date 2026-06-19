"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTask, useAddTaskComment, useUploadTaskFile } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { CalendarIcon, UserIcon, LinkIcon, Send, MessageSquare, Paperclip, FileIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: addComment, isPending: isCommenting } = useAddTaskComment();
  const { mutate: uploadFile, isPending: isUploading } = useUploadTaskFile();
  const { data: usersData } = useUsers();
  const admins = usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)) || [];
  
  const [description, setDescription] = useState(task.description || "");
  const [commentText, setCommentText] = useState("");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [orderId, setOrderId] = useState(task.orderId || "");
  const [customerUsername, setCustomerUsername] = useState(task.customerUsername || "");
  const [assignee, setAssignee] = useState(task.assignee || "");

  const handleSaveDetails = () => {
    updateTask({
      id: task._id,
      data: {
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderId,
        customerUsername,
        assignee: assignee === "unassigned" ? null : assignee
      }
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment({ id: task._id, text: commentText }, {
      onSuccess: () => setCommentText("")
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadFile({ id: task._id, file });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[85vh] max-h-[85vh]">
          
          {/* Main Content (Left, 2/3 width) */}
          <div className="md:col-span-2 flex flex-col border-r border-border/50 bg-background">
            <div className="p-6 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold leading-tight">{task.title}</DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span> Description
                </label>
                <Textarea 
                  className="min-h-[120px] bg-muted/30 focus-visible:ring-1 border-border/50 shadow-sm resize-none" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Add more details to this task..."
                  onBlur={handleSaveDetails}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                {task.files && task.files.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {task.files.map((file: any, idx: number) => (
                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                          <FileIcon className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" /> Comments
                </label>
                
                <div className="space-y-4">
                  {task.comments?.map((comment: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <Avatar className="w-8 h-8 border border-border/50 bg-muted">
                        <AvatarFallback className="text-xs">{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/40 rounded-xl rounded-tl-none p-3 border border-border/50">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{comment.userName}</span>
                            {comment.role === 'client' && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/20 text-primary">Customer</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(!task.comments || task.comments.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border/50">No comments yet.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  id="task-file-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button 
                  onClick={() => document.getElementById('task-file-upload')?.click()} 
                  disabled={isUploading} 
                  variant="outline"
                  size="icon" 
                  className="shrink-0 shadow-sm"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
                <Input 
                  placeholder="Ask a question or post an update..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="bg-background shadow-sm"
                />
                <Button onClick={handleAddComment} disabled={isCommenting} size="icon" className="shrink-0 bg-primary shadow-sm hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Sidebar (Right, 1/3 width) */}
          <div className="bg-muted/10 p-6 space-y-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Properties</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" /> Assignee
                </label>
                <Select value={assignee} onValueChange={(v) => { setAssignee(v); handleSaveDetails(); }}>
                  <SelectTrigger className="h-9 bg-background shadow-sm border-border/50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {admins.map((admin: any) => (
                      <SelectItem key={admin._id} value={admin._id}>{admin.name || admin.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" /> Due Date
                </label>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  onBlur={handleSaveDetails}
                  className="h-9 bg-background shadow-sm border-border/50"
                />
              </div>

              <div className="space-y-1.5 pt-4 border-t border-border/50">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Link Order ID
                </label>
                <Input 
                  placeholder="E.g., 60d5ecb..." 
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)} 
                  onBlur={handleSaveDetails}
                  className="h-9 bg-background shadow-sm border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Link Username
                </label>
                <Input 
                  placeholder="E.g., johndoe" 
                  value={customerUsername} 
                  onChange={e => setCustomerUsername(e.target.value)} 
                  onBlur={handleSaveDetails}
                  className="h-9 bg-background shadow-sm border-border/50"
                />
              </div>
            </div>
            
            {(orderId || customerUsername) && (
              <div className="pt-4 space-y-2 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Links</h3>
                <div className="flex flex-col gap-2">
                  {orderId && (
                    <a href={`/admin/orders?search=${orderId}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md w-fit font-medium">
                      View Order
                    </a>
                  )}
                  {customerUsername && (
                    <a href={`/admin/artworks?search=${customerUsername}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md w-fit font-medium">
                      View Artworks
                    </a>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
