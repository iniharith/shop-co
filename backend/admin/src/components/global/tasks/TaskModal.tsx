"use client";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTask, useAddTaskComment, useUploadTaskFile, useDeleteTaskFile } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Calendar, User, Link, Send, MessageSquare, Paperclip, File, LoaderCircle, Trash2, Tag } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useOrders } from "@/hooks/useOrder";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: addComment, isPending: isCommenting } = useAddTaskComment();
  const { mutate: uploadFile, isPending: isUploading } = useUploadTaskFile();
  const { mutate: deleteFile, isPending: isDeletingFile } = useDeleteTaskFile();
  const { data: usersData } = useUsers();
  const { data: ordersData } = useOrders();
  const admins = usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)) || [];
  const customers = usersData?.users?.filter((u: any) => u.role === 'client') || [];
  const allUsers = usersData?.users || [];
  const orders = ordersData?.orders || [];
  
  const [openOrderBox, setOpenOrderBox] = useState(false);
  const [openUserBox, setOpenUserBox] = useState(false);
  
  const [description, setDescription] = useState(task.description || "");
  const [commentText, setCommentText] = useState("");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [orderId, setOrderId] = useState(task.orderId || "");
  const [customerUsername, setCustomerUsername] = useState(task.customerUsername || "");
  const [category, setCategory] = useState(task.category || "UNASSIGNED");
  const [title, setTitle] = useState(task.title || "");
  const getAssigneeId = (val: any) => typeof val === 'object' && val !== null ? val._id : (val || "");
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
        assignee: assignee === "unassigned" ? null : assignee,
        ...overrides
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
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        uploadFile({ id: task._id, file });
      });
      // Clear the input so the same files can be uploaded again if needed
      e.target.value = "";
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
                <DialogTitle className="sr-only">Task Details</DialogTitle>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onBlur={() => handleSaveDetails()}
                    className="text-xl font-semibold leading-tight border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                
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
                  onBlur={() => handleSaveDetails()}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                {task.files && task.files.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {task.files.map((file: any, idx: number) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden relative group">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
                              {isImage ? (
                                <div className="w-12 h-12 shrink-0 rounded overflow-hidden">
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 shrink-0 bg-muted flex items-center justify-center rounded">
                                  <File className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <span className="text-xs font-medium truncate">{file.name}</span>
                            </a>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm('Are you sure you want to delete this file?')) {
                                  deleteFile({ id: task._id, fileId: file._id || file.url.split('/').pop() });
                                }
                              }}
                              disabled={isDeletingFile}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
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
                  multiple
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
                  {isUploading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
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
                      <CommandInput placeholder="Search order ID..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No order found.</CommandEmpty>
                        <CommandGroup>
                          {orders.map((o: any) => (
                            <CommandItem
                              key={o._id}
                              value={(o as any).orderId || o._id}
                              onSelect={(currentValue) => {
                                setOrderId(currentValue === orderId ? "" : o._id);
                                handleSaveDetails({ orderId: currentValue === orderId ? "" : o._id });
                                setOpenOrderBox(false);
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
                      <CommandInput placeholder="Search customer name or email..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c: any) => (
                            <CommandItem
                              key={c._id}
                              value={c.name + ' ' + c.email}
                              onSelect={(currentValue) => {
                                const newUsername = c.name || c.email;
                                setCustomerUsername(newUsername === customerUsername ? "" : newUsername);
                                handleSaveDetails({ customerUsername: newUsername === customerUsername ? "" : newUsername });
                                setOpenUserBox(false);
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
