"use client";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTask, useAddTaskComment, useUploadTaskFile, useDeleteTaskFile, useUpdateTaskFileNotes, useDeleteTaskComment } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Calendar, User, Link, Send, MessageSquare, Paperclip, File, LoaderCircle, Trash2, Tag } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/useOrder";
import { Check, ChevronsUpDown, Download as DownloadIcon } from "lucide-react";
import { cn, forceDownload } from "@/lib/utils";
import { useAllFiles } from "@/hooks/useAdminDashboard";
import { useRouter } from "next/navigation";

const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile }: any) => {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
  const [notes, setNotes] = useState(file.notes || "");
  const { mutate: updateNotes, isPending } = useUpdateTaskFileNotes();

  // Reset local state if external notes change
  React.useEffect(() => {
    setNotes(file.notes || "");
  }, [file.notes]);

  const handleSave = () => {
    if (notes !== (file.notes || "")) {
      updateNotes({ id: task._id, fileUrl: file.url, notes }, {
        onSuccess: () => toast.success("Notes saved and synced successfully")
      });
    }
  };

  return (
    <div className="relative group w-fit max-w-full mb-5 mt-1">
      {/* Dark container matching the sketch */}
      <div className="flex items-center gap-2 bg-[#5a5a5a] p-1.5 pr-2 rounded-[16px] w-full min-w-[190px] shadow-sm relative z-10 overflow-hidden">
        
        {/* Left: Icon or Thumbnail */}
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-[#666666] flex items-center justify-center shrink-0 hover:bg-[#777777] transition-colors">
          {file.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
            <img src={file.url} alt="thumbnail" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <File className="w-6 h-6 text-primary/80" />
          )}
        </a>
        
        {/* Right: Filename, Tag & Buttons */}
        <div className="flex-1 flex flex-col justify-center min-w-0 mr-1 pl-1 gap-0.5">
          {/* Absolute Top Right Badge */}
          {file.tag === 'draft' ? (
            <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Draft</div>
          ) : file.tag === 'for_print' ? (
            <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">For Print</div>
          ) : (
            <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Attachment</div>
          )}
          
          {/* Bottom: Filename & Actions */}
          <div className="flex justify-between items-center w-full min-w-0 mt-2">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate text-white font-medium text-[12px] tracking-wide hover:underline pr-2">
              {file.name}
            </a>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6 shrink-0 text-blue-400 hover:text-blue-500 hover:bg-white/10 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  forceDownload(file.url, file.name);
                }}
                title="Download"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6 shrink-0 text-red-400 hover:text-red-500 hover:bg-white/10 rounded-full ml-0.5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this file?')) {
                    deleteFile({ id: task._id, fileId: file._id || file.url.split('/').pop() });
                  }
                }}
                disabled={isDeletingFile}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Box - Yellow Pill overlapping */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 shadow-md bg-[#fde047] rounded-[6px] flex items-center w-[70%] transition-all focus-within:ring-2 focus-within:ring-white">
        <Input 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
             if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
             }
          }}
          placeholder="add note"
          className="bg-transparent border-0 text-black placeholder:text-black/60 font-medium h-6 px-1.5 w-full focus-visible:ring-0 focus-visible:ring-offset-0 text-[8px] md:text-[10px] leading-tight"
        />
        {isPending && <LoaderCircle className="w-3 h-3 animate-spin text-black mr-2 shrink-0" />}
      </div>
    </div>
  );
};

interface TaskModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: addComment, isPending: isCommenting } = useAddTaskComment();
  const { mutate: deleteCommentApi, isPending: isDeletingComment } = useDeleteTaskComment();
  const { mutate: uploadFile, isPending: isUploading } = useUploadTaskFile();
  const { mutate: deleteFile, isPending: isDeletingFile } = useDeleteTaskFile();
  const { data: usersData } = useUsers();
  const { data: ordersData } = useOrders();
  const { data: allFilesData } = useAllFiles();
  const router = useRouter();

  const admins = usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(u.role)) || [];
  const customers = usersData?.users?.filter((u: any) => u.role === 'client') || [];
  const allUsers = usersData?.users || [];
  const orders = ordersData?.orders || [];
  
  const [openOrderBox, setOpenOrderBox] = useState(false);
  const [openUserBox, setOpenUserBox] = useState(false);
  const uploadTagRef = React.useRef<string>('attachment');
  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const [description, setDescription] = useState(task.description || "");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const combinedFiles = React.useMemo(() => {
    let files = [...(task?.files || [])];
    
    // Add customer uploaded files from share link
    const allFiles = (allFilesData as any)?.data || [];
    const customerFiles = allFiles.filter((f: any) => {
      // Don't duplicate if already in task.files (by some chance)
      if (files.some(tf => tf.url === f.path)) return false;
      
      return (f.shareSlug && (f.shareSlug === task.title || f.shareSlug === task.customerUsername || f.shareSlug === task.orderId)) ||
             (f.taskId === task._id) ||
             (task.orderId && f.orderId === task.orderId && f.category === 'artwork') ||
             (task.customerUsername && f._shareFolderName === task.customerUsername);
    }).map((f: any) => ({
      url: f.path,
      name: f.originalName,
      notes: f.notes || f.adminNotes, // Make sure to sync notes
      tag: 'customer_upload',
      _id: f._id
    }));
    
    return [...files, ...customerFiles];
  }, [task, allFilesData]);

  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [orderId, setOrderId] = useState(task.orderId || "");
  const [customerUsername, setCustomerUsername] = useState(task.customerUsername || "");
  const [category, setCategory] = useState(task.category || "UNASSIGNED");
  const [status, setStatus] = useState(task.status || "PLACED");
  const [title, setTitle] = useState(task.title || "");
  const getAssigneeId = (val: any) => typeof val === 'object' && val !== null ? val._id : (val || "unassigned");
  const [assignee, setAssignee] = useState(getAssigneeId(task.assignee));

  const handleSaveDetails = (overrides?: any) => {
    updateTask({
      id: task._id,
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderId,
        customerUsername,
        category,
        status,
        assignee: assignee === "unassigned" ? null : assignee,
        ...overrides
      }
    }, {
      onSuccess: () => toast.success("Task details updated!")
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment({ id: task._id, text: commentText }, {
      onSuccess: () => setCommentText("")
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        uploadFile({ id: task._id, file, tag: uploadTagRef.current }, {
          onSuccess: () => {
            toast.success("File uploaded successfully");
          },
          onError: () => toast.error("Failed to upload file")
        });
      });
      // reset input
      e.target.value = '';
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentApi({ id: task._id, commentId });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] md:w-full p-0 overflow-hidden bg-background border-border shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
          
          {/* Main Content (Left, 2/3 width) */}
          <div className="flex-none md:flex-1 flex flex-col md:border-r border-border/50 bg-background min-h-0 shrink-0 md:shrink">
            <div className="p-4 md:p-6 border-b border-border/50 shrink-0">
              <DialogHeader>
                <DialogTitle className="sr-only">Task Details</DialogTitle>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onBlur={() => handleSaveDetails()}
                    className="text-xl font-semibold leading-tight border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                
              </DialogHeader>
            </div>
            
            <div className="flex-none md:flex-1 p-4 md:p-6 space-y-6 md:overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span> Description
                </label>
                <Textarea 
                  className="min-h-[120px] bg-muted/30 focus-visible:ring-1 border-border/50 shadow-sm overflow-hidden resize-none" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "0px";
                    target.style.height = target.scrollHeight + "px";
                  }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "0px";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                  placeholder="Add more details to this task..."
                  onBlur={() => handleSaveDetails()}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                {combinedFiles && combinedFiles.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {combinedFiles.slice(0, 10).map((file: any, idx: number) => (
                          <FileAttachmentCard 
                            key={idx} 
                            task={task} 
                            file={file} 
                            deleteFile={deleteFile} 
                            isDeletingFile={isDeletingFile} 
                          />
                        ))}
                      </div>
                      {combinedFiles.length > 10 && (
                        <div className="mt-4 flex justify-center">
                          <Button 
                            variant="secondary" 
                            className="w-full shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => {
                              onClose();
                              // Open Artworks Manager and try to pre-select the folder using task title
                              router.push(`/admin/artworks?folder=${encodeURIComponent(task.title)}`);
                            }}
                          >
                            View all {combinedFiles.length} files in Artworks Manager
                          </Button>
                        </div>
                      )}
                    </div>)}
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                    <TabsList className="h-8 bg-transparent p-0">
                      <TabsTrigger value="comments" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-bold data-[state=active]:underline underline-offset-8 decoration-2 decoration-primary px-4">
                        Comments
                      </TabsTrigger>
                      <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-bold data-[state=active]:underline underline-offset-8 decoration-2 decoration-primary px-4">
                        All activity
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="comments" className="mt-0">
                    <div className="space-y-4">
                      {task.comments?.map((comment: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <Avatar className="w-8 h-8 border border-border/50 bg-muted shrink-0">
                            <AvatarFallback className="text-xs">{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/40 rounded-xl rounded-tl-none p-3 border border-border/50">
                            <div className="flex justify-between items-baseline mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{comment.userName}</span>
                                {comment.role === 'client' && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/20 text-primary">Customer</Badge>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-400/10 p-0 rounded-full shrink-0"
                                    onClick={() => handleDeleteComment(comment._id)}
                                    disabled={isDeletingComment}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      {(!task.comments || task.comments.length === 0) && (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border/50">No comments yet.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0">
                    <div className="space-y-4">
                      {/* Show activities, sort by createdAt */}
                      {(() => {
                        const activityItems = [
                          ...(task.activities || []).filter((a: any) => !a.action.startsWith("changed the description") && !a.action.startsWith("added a comment")).map((a: any) => ({ ...a, type: 'activity' }))
                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        
                        return (
                          <div className="space-y-3">
                            {activityItems.length === 0 && !task.createdAt ? (
                              <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border/50">No activity yet.</div>
                            ) : (
                              <>
                                {task.createdAt && (
                                  <div className="flex gap-3 items-center text-sm py-1">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 shrink-0 flex items-center justify-center">
                                      <span className="text-[9px] font-bold text-primary">✦</span>
                                    </div>
                                    <div className="flex-1 text-muted-foreground">
                                      <span className="font-semibold text-foreground mr-1">Task</span>
                                      created
                                      <span className="text-[10px] ml-2 text-muted-foreground/70">• {format(new Date(task.createdAt), "MMM d, h:mm a")}</span>
                                    </div>
                                  </div>
                                )}
                                {activityItems.map((item: any, idx: number) => (
                                  <div key={`a-${idx}`} className="flex gap-3 items-center text-sm py-1">
                                    <Avatar className="w-6 h-6 border border-border/50 bg-muted shrink-0 text-[10px]">
                                      <AvatarFallback>{item.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-muted-foreground">
                                      <span className="font-semibold text-foreground mr-1">{item.userName}</span>
                                      {item.action}
                                      <span className="text-[10px] ml-2 text-muted-foreground/70">• {format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="p-4 border-y md:border-y-0 md:border-t border-border/50 bg-muted/10 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  id="task-file-upload" 
                  className="hidden" 
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      disabled={isUploading} 
                      variant="outline"
                      size="icon" 
                      className="shrink-0 shadow-sm"
                    >
                      {isUploading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {
                      uploadTagRef.current = 'attachment';
                      setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                    }}>
                      <Badge className="bg-gray-500 mr-2 text-[10px]">Attachment</Badge> Upload Attachment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      uploadTagRef.current = 'draft';
                      setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                    }}>
                      <Badge className="bg-orange-500 mr-2 text-[10px]">Draft</Badge> Upload Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      uploadTagRef.current = 'for_print';
                      setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                    }}>
                      <Badge className="bg-green-500 mr-2 text-[10px]">For Print</Badge> Upload For Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
          <div className="w-full md:w-72 lg:w-80 bg-muted/10 p-4 md:p-6 space-y-6 shrink-0 md:overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Properties</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Assignee
                </label>
                <Select value={assignee} onValueChange={(v) => { setAssignee(v); handleSaveDetails({ assignee: v === "unassigned" ? null : v }); }}>
                  <SelectTrigger className="h-9 bg-background shadow-sm border-border/50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {allUsers.map((user: any) => (
                      <SelectItem key={user._id} value={user._id}>{user.name || user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Category
                </label>
                <Select value={category} onValueChange={(v) => { setCategory(v); handleSaveDetails({ category: v }); }}>
                  <SelectTrigger className="h-9 bg-background shadow-sm border-border/50">
                    <SelectValue placeholder="Unassigned" />
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

              <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" /> Product Status
                  </label>
                  <Select value={status} onValueChange={(v) => { setStatus(v); handleSaveDetails({ status: v }); }}>
                    <SelectTrigger className="h-9 bg-background shadow-sm border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 
                        'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 
                        'IN_PRODUCTION', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 
                        'CANCELLED', 'FAILED'
                      ].map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  onBlur={() => handleSaveDetails()}
                  className="h-9 bg-background shadow-sm border-border/50"
                />
              </div>

              <div className="space-y-1.5 pt-4 border-t border-border/50">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Link className="w-3.5 h-3.5" /> Link Order ID
                </label>
                <Popover open={openOrderBox} onOpenChange={setOpenOrderBox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openOrderBox}
                      className="w-full justify-between h-9 bg-background shadow-sm border-border/50 text-xs font-normal"
                    >
                      {orderId ? ((orders.find((o: any) => o._id === orderId) as any) ? `Order #${(orders.find((o: any) => o._id === orderId) as any)?.orderId}` : orderId) : "Select order..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search order ID..." className="h-9" value={orderSearch} onValueChange={setOrderSearch} />
                      <CommandList>
                        <CommandEmpty>No order found. Type to use custom order ID.</CommandEmpty>
                        <CommandGroup>
                          {orderSearch && !orders.some((o: any) => o._id === orderSearch || o.orderId === orderSearch) && (
                            <CommandItem
                              value={orderSearch}
                              onSelect={() => {
                                setOrderId(orderSearch);
                                handleSaveDetails({ orderId: orderSearch });
                                setOpenOrderBox(false);
                                setOrderSearch("");
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", orderId === orderSearch ? "opacity-100" : "opacity-0")} />
                              Use custom: "{orderSearch}"
                            </CommandItem>
                          )}
                          {orders.map((o: any) => (
                            <CommandItem
                              key={o._id}
                              value={(o as any).orderId || o._id}
                              onSelect={(currentValue) => {
                                setOrderId(currentValue === orderId ? "" : o._id);
                                handleSaveDetails({ orderId: currentValue === orderId ? "" : o._id });
                                setOpenOrderBox(false);
                                setOrderSearch("");
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", orderId === o._id ? "opacity-100" : "opacity-0")} />
                              Order #{(o as any).orderId}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Link className="w-3.5 h-3.5" /> Link Username
                </label>
                <Popover open={openUserBox} onOpenChange={setOpenUserBox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUserBox}
                      className="w-full justify-between h-9 bg-background shadow-sm border-border/50 text-xs font-normal truncate"
                    >
                      {customerUsername ? customerUsername : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search customer name or email..." className="h-9" value={userSearch} onValueChange={setUserSearch} />
                      <CommandList>
                        <CommandEmpty>No customer found. Type to use custom username.</CommandEmpty>
                        <CommandGroup>
                          {userSearch && !customers.some((c: any) => c.name === userSearch || c.email === userSearch) && (
                            <CommandItem
                              value={userSearch}
                              onSelect={() => {
                                setCustomerUsername(userSearch);
                                handleSaveDetails({ customerUsername: userSearch });
                                setOpenUserBox(false);
                                setUserSearch("");
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", customerUsername === userSearch ? "opacity-100" : "opacity-0")} />
                              Use custom: "{userSearch}"
                            </CommandItem>
                          )}
                          {customers.map((c: any) => (
                            <CommandItem
                              key={c._id}
                              value={c.name + ' ' + c.email}
                              onSelect={(currentValue) => {
                                const newUsername = c.name || c.email;
                                setCustomerUsername(newUsername === customerUsername ? "" : newUsername);
                                handleSaveDetails({ customerUsername: newUsername === customerUsername ? "" : newUsername });
                                setOpenUserBox(false);
                                setUserSearch("");
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", customerUsername === (c.name || c.email) ? "opacity-100" : "opacity-0")} />
                              {c.name} ({c.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {(orderId || customerUsername) && (
              <div className="pt-4 space-y-2 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Links</h3>
                <div className="flex flex-col gap-2">
                  {orderId && (
                    <div className="flex flex-col gap-2">
                      <a href={`/admin/orders?search=${orderId}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md w-fit font-medium">
                        View Order
                      </a>
                      
                      {(orders.find((o: any) => o._id === orderId) as any)?.awbUrl ? (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="text-xs h-8"
                            onClick={() => window.open((orders.find((o: any) => o._id === orderId) as any)?.awbUrl, "_blank")}
                          >
                            View AWB
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs h-8"
                            onClick={() => {
                                const win = window.open((orders.find((o: any) => o._id === orderId) as any)?.awbUrl, "_blank");
                                win?.print();
                            }}
                          >
                            Print AWB
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 w-fit mt-2 border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => alert("EasyParcel integration: AWB will be automatically assigned here.")}
                        >
                          Assign AWB
                        </Button>
                      )}
                    </div>
                  )}
                  {customerUsername && (
                    <a href={`/admin/artworks?search=${customerUsername}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md w-fit font-medium">
                      View Artworks
                    </a>
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-6 mt-auto border-t border-border/50">
              <Button onClick={onClose} className="w-full font-bold">Done</Button>
            </div>
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
