/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useTask, useAddTaskComment, useUploadTaskFile, useDeleteTaskFile, useUpdateTaskFileNotes, useDeleteTaskComment, usePinTaskComment } from "@/hooks/useTasks";
import { uploadTaskFile } from "@/api/tasks";
import { useUploadStore } from '@/store/uploadStore';
import { useUsers } from "@/hooks/useUsers";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, User, Link, Send, MessageSquare, Paperclip, File, LoaderCircle, Trash2, Tag, Share2, Pin, X, AlertCircle, RefreshCw, CheckCircle, Folder } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/useOrder";
import { FilePreviewModal } from "@/components/global/FilePreviewModal";
import { Check, ChevronsUpDown, Download as DownloadIcon, Copy } from "lucide-react";
import { cn, forceDownload } from "@/lib/utils";
import { useAllFiles } from "@/hooks/useAdminDashboard";
import { useRouter } from "next/navigation";
import { AssigneeTag, AssigneeDot } from "@/lib/userColor";

const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal }: any) => {
  const isImageFile = file.mimetype?.includes("image") || (file.name || file.url).match(/\.(jpeg|jpg|gif|png|webp|heic)$/i);
  const isPdfFile = file.mimetype?.includes("pdf") || (file.name || file.url).match(/\.pdf$/i);
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

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  let fileUrlStr = file.url.startsWith('http') ? file.url : `${backendUrl}/${file.url.replace(/^\/+/, '')}`;
  fileUrlStr = fileUrlStr.replace(/\\/g, '/');
  const encodedFileUrl = encodeURI(fileUrlStr);
  
  const proxyUrl = `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(fileUrlStr)}&name=${encodeURIComponent(file.name)}&stream=true`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanShareLink = `${window.location.origin}/share/file/${file._id || file.id}`;
    navigator.clipboard.writeText(cleanShareLink);
    toast.success("Share link copied to clipboard");
  };

  return (
    <div className="relative group w-fit max-w-full mb-6 mt-1">
      {/* Dark container matching the sketch */}
      <div className="flex items-center gap-1.5 bg-[#5a5a5a] p-1.5 pb-3 pr-1.5 rounded-[12px] w-full min-w-[140px] shadow-sm relative z-10 overflow-visible">
        
        {/* Left: Icon or Thumbnail */}
        <a 
          href={proxyUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-8 h-8 rounded-lg bg-[#666666] flex items-center justify-center shrink-0 hover:bg-[#777777] transition-colors overflow-hidden relative group/thumb"
        >
          {isImageFile ? (
            <>
              <Image 
                src={encodedFileUrl} 
                alt="thumbnail" 
                width={60}
                height={60}
                quality={40}
                className="w-full h-full object-cover absolute inset-0 z-0" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextEl) nextEl.style.display = 'flex';
                }}
              />
              <File className="w-4 h-4 text-primary/80 relative z-10" style={{ display: 'none' }} />
            </>
          ) : isPdfFile ? (
            <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
              <iframe 
                src={`${proxyUrl}&inline=true#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                className="absolute top-0 left-0 border-none overflow-hidden"
                style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', pointerEvents: 'none' }}
                tabIndex={-1}
              />
              {/* Optional overlay to prevent interaction with iframe inside a tag */}
              <div className="absolute inset-0 z-10"></div>
            </div>
          ) : (
            <File className="w-4 h-4 text-primary/80 relative z-10" />
          )}
        </a>
        
        {/* Right: Filename, Tag & Buttons */}
        <div className="flex-1 flex flex-col justify-center min-w-0 mr-1 pl-0.5 gap-0.5 pt-3">
          {/* Absolute Top Right Badge */}
          {file.tag === 'draft' ? (
            <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Draft</div>
          ) : file.tag === 'for_print' ? (
            <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">For Print</div>
          ) : (
            <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Attachment</div>
          )}
          
          {/* Bottom: Filename & Actions */}
          <div className="flex justify-between items-center w-full min-w-0 mt-1">
            <a 
              href={file.url} 
              onClick={(e) => {
                e.preventDefault();
                const isImageOrPdf = file.mimetype?.includes("image") || file.mimetype?.includes("pdf") || (file.name || file.url).match(/\.(jpeg|jpg|gif|png|webp|heic|pdf)$/i);
                if (isImageOrPdf && onPreview) {
                  onPreview(file);
                } else {
                  window.open(file.url, "_blank");
                }
              }}
              className="truncate text-white font-medium text-[10px] tracking-wide hover:underline pr-1 cursor-pointer"
            >
              {file.name}
            </a>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-5 h-5 shrink-0 text-blue-400 hover:text-blue-500 hover:bg-white/10 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  forceDownload(file.url, file.name);
                }}
                title="Download"
              >
                <DownloadIcon className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-5 h-5 shrink-0 text-slate-400 hover:text-slate-500 hover:bg-white/10 rounded-full ml-0.5"
                onClick={handleCopyLink}
                title="Copy Share Link"
              >
                <Share2 className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-5 h-5 shrink-0 text-red-400 hover:text-red-500 hover:bg-white/10 rounded-full ml-0.5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this file?')) {
                    const fid = file._id || file.url.split('/').pop();
                    if (onDeleteLocal) onDeleteLocal(fid);
                    deleteFile({ id: task._id, fileId: fid });
                  }
                }}
                disabled={isDeletingFile}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Box - Yellow Pill overlapping */}
      <div className="absolute -bottom-[16px] left-1/2 -translate-x-1/2 z-20 shadow-md bg-[#fde047] rounded-[4px] flex items-center w-[85%] transition-all focus-within:ring-2 focus-within:ring-white">
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
  const { data: fullTaskResponse, isPending: isLoadingFullTask } = useTask(isOpen ? task?._id : undefined);
  const fullTask = fullTaskResponse?.task || task;
  
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: addComment, isPending: isCommenting } = useAddTaskComment();
  const { mutate: deleteCommentApi, isPending: isDeletingComment } = useDeleteTaskComment();
  const { mutate: pinCommentApi, isPending: isPinningComment } = usePinTaskComment();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadTaskFile();
  const { mutate: deleteFile, isPending: isDeletingFile } = useDeleteTaskFile();
  const { data: usersData } = useUsers();
  const { data: ordersData } = useOrders();
  const { data: allFilesData } = useAllFiles();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
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
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOverComment, setIsDragOverComment] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const { uploads, addUpload, updateProgress, updateStatus, removeUpload } = useUploadStore();
  const uploadingFiles = Object.values(uploads).filter(u => 
    u.taskId === task._id && 
    (u.status === 'uploading' || u.status === 'error' || 
      (u.status === 'success' && !task.files?.some((cf: any) => cf.name === u.name)))
  );
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);

  const allFiles = (allFilesData as any)?.data || [];
  const customerUploadOrderIds = Array.from(new Set(allFiles.filter((f: any) => f.orderId).map((f: any) => f.orderId))) as string[];
  const customOrderIds = customerUploadOrderIds.filter(id => !orders.some((o: any) => o._id === id || o.orderId === id));

  const customerUploadUsernames = Array.from(new Set(allFiles.filter((f: any) => f.userId).map((f: any) => f.userId))) as string[];
  const customUsernames = customerUploadUsernames.filter(name => !customers.some((c: any) => c.name === name || c.email === name));

  const combinedFiles = React.useMemo(() => {
    let files = [...(task?.files || [])];
    
    // Add customer uploaded files from share link or public upload portal
    const allFiles = (allFilesData as any)?.data || [];
    const customerFiles = allFiles.filter((f: any) => {
      // Don't duplicate if already in task.files (by some chance)
      if (files.some(tf => tf.url === f.path)) return false;
      
      // Auto-sync files matching the task's Order ID and Customer Username
      const matchesOrderAndUser = Boolean(task.orderId && task.customerUsername && f.orderId === task.orderId && f.userId === task.customerUsername);
      
      return matchesOrderAndUser ||
             (f.shareSlug && (f.shareSlug === task.title || f.shareSlug === task.customerUsername || f.shareSlug === task.orderId)) ||
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
    
    return [...files, ...customerFiles].filter(f => {
      const fid = f._id || f.url?.split('/').pop();
      return !deletedFileIds.includes(fid);
    });
  }, [task, allFilesData, deletedFileIds]);

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
        const id = Math.random().toString(36).substring(7);
        const tag = uploadTagRef.current;
        const abortController = new AbortController();
        
        addUpload({ id, name: file.name, tag, taskId: task._id, file, abortController });
        
        uploadFile({ 
          id: task._id, 
          file, 
          tag, 
          onProgress: (percent) => updateProgress(id, percent),
          abortController 
        })
        .then(() => {
          updateStatus(id, 'success');
          setTimeout(() => removeUpload(id), 5000);
        })
        .catch((err) => {
          if (err.message !== "Upload cancelled") {
            updateStatus(id, 'error', err.message || "Failed to upload file");
          }
        });
      });
      // reset input
      e.target.value = '';
    }
  };

  const handleRetryUpload = (upload: any) => {
    if (!upload.file) return;
    updateStatus(upload.id, 'uploading', undefined);
    updateProgress(upload.id, 0);
    const abortController = new AbortController();
    removeUpload(upload.id);
    addUpload({ id: upload.id, name: upload.name, tag: upload.tag, taskId: upload.taskId, file: upload.file, abortController });
    
    uploadFile({ 
      id: upload.taskId, 
      file: upload.file, 
      tag: upload.tag, 
      onProgress: (percent) => updateProgress(upload.id, percent), 
      abortController 
    })
    .then(() => {
      updateStatus(upload.id, 'success');
      setTimeout(() => removeUpload(upload.id), 5000);
    })
    .catch((err) => {
      if (err.message !== "Upload cancelled") {
        updateStatus(upload.id, 'error', err.message || "Failed to upload file");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentApi({ id: task._id, commentId });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1200px] w-[95vw] md:w-[95vw] p-0 overflow-hidden bg-background border-border shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
          
          {/* Main Content (Left, 70% width) */}
          <div className="flex-none md:w-[70%] flex flex-col md:border-r border-border/50 bg-background min-h-0 shrink-0 md:shrink">
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
                {(combinedFiles && combinedFiles.length > 0) || uploadingFiles.length > 0 ? (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments
                        </label>
                        {task.status === "IN_PRODUCTION" ? (
                          <a href={`/admin/production?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors" title="Go to Production Folder">
                            <Folder className="w-3.5 h-3.5" />
                            Production Folder
                          </a>
                        ) : task.status === "PACKAGING" || task.status === "SHIPPED" || task.status === "DELIVERED" ? (
                          <a href={`/admin/packaging?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors" title="Go to Packaging Folder">
                            <Folder className="w-3.5 h-3.5" />
                            Packaging Folder
                          </a>
                        ) : (
                          <a href={`/admin/artworks?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors" title="Go to Artwork Folder">
                            <Folder className="w-3.5 h-3.5" />
                            Artwork Folder
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                        {uploadingFiles.map(f => (
                          <div key={f.id} className={`relative group w-fit max-w-full mb-6 mt-1 opacity-70 ${f.status === 'uploading' ? 'animate-pulse' : ''}`}>
                            <div className={`flex items-center gap-1.5 p-1.5 pb-3 pr-1.5 rounded-[12px] w-full min-w-[140px] shadow-sm relative z-10 overflow-visible ${f.status === 'error' ? 'bg-[#ffcfcf]' : 'bg-[#5a5a5a]'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${f.status === 'error' ? 'bg-[#ff9999]' : 'bg-[#666666]'}`}>
                                {f.status === 'uploading' ? (
                                  <LoaderCircle className="w-4 h-4 text-white animate-spin" />
                                ) : f.status === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1 flex flex-col justify-center min-w-0 mr-1 pl-0.5 gap-0.5 pt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeUpload(f.id);
                                  }}
                                  className="absolute top-1 left-1 p-0.5 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors z-20"
                                  title={f.status === 'error' ? 'Dismiss' : 'Cancel Upload'}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                {f.status === 'error' && f.file && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetryUpload(f);
                                    }}
                                    className="absolute top-1 left-5 ml-1 p-0.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors z-20"
                                    title="Retry Upload"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                )}
                                {f.tag === 'draft' ? (
                                  <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Draft</div>
                                ) : f.tag === 'for_print' ? (
                                  <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">For Print</div>
                                ) : (
                                  <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Attachment</div>
                                )}
                                <div className="flex justify-between items-center w-full min-w-0 mt-1">
                                  <span className={`truncate font-medium text-[10px] tracking-wide pr-1 ${f.status === 'error' ? 'text-red-900' : 'text-white'}`}>
                                    {f.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-4 left-[5%] right-[5%] z-0">
                              <div className={`w-full text-[10px] font-medium p-1 px-3 rounded-b-[12px] shadow-sm text-center ${f.status === 'error' ? 'bg-red-500 text-white' : 'bg-[#fae863] text-black'}`}>
                                {f.status === 'uploading' ? `Uploading... ${f.progress}%` : f.status === 'success' ? 'Uploaded!' : 'Failed'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {combinedFiles.slice(0, 12).map((file: any) => (
                          <FileAttachmentCard 
                            key={file.url} 
                            task={task} 
                            file={file} 
                            deleteFile={deleteFile} 
                            isDeletingFile={isDeletingFile} 
                            onPreview={setPreviewFile}
                            onDeleteLocal={(fid: string) => setDeletedFileIds(prev => [...prev, fid])}
                          />
                        ))}
                      </div>
                      {combinedFiles.length > 12 && (
                        <div className="mt-4 flex justify-center">
                          <Button 
                            variant="secondary" 
                            className="w-full shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => {
                              onClose();
                              router.push(`/admin/artworks?folder=${encodeURIComponent(task.title)}`);
                            }}
                          >
                            View all {combinedFiles.length} files in Artworks Manager
                          </Button>
                        </div>
                      )}
                    </div>
                ) : null}
                
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
                      {isLoadingFullTask ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Loading comments...</div>
                      ) : [...(fullTask?.comments || [])].sort((a: any, b: any) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      }).map((comment: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <Avatar className="w-8 h-8 border border-border/50 bg-muted shrink-0">
                            <AvatarFallback className="text-xs">{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 p-3 border-b border-border/10 ${comment.pinned ? 'bg-yellow-100/50 dark:bg-yellow-500/10 dark:border-yellow-500/20 shadow-md rounded-xl rounded-tl-none' : 'bg-transparent'}`}>
                            <div className="flex justify-between items-baseline mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{comment.userName}</span>
                                {comment.role === 'client' && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/20 text-primary">Customer</Badge>
                                )}
                                {comment.pinned && <Pin className="w-3 h-3 text-yellow-600 ml-1 inline" />}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-5 w-5 p-0 rounded-full shrink-0 ${comment.pinned ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-200/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                    onClick={() => pinCommentApi({ id: task._id, commentId: comment._id, pinned: !comment.pinned })}
                                    disabled={isPinningComment}
                                  >
                                    <Pin className="h-3 w-3" />
                                  </Button>
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
                            <p className={`text-sm leading-relaxed ${comment.pinned ? 'font-bold text-foreground' : 'text-foreground'}`}>
                              {comment.text}
                            </p>
                            {(() => {
                              const match = comment.text?.match(/Note updated for artwork \((.+)\):/);
                              if (match && match[1]) {
                                const filename = match[1];
                                const fileObj = task.files?.find((f: any) => f.name === filename || f.originalName === filename || f.url?.includes(filename));
                                if (fileObj && fileObj.url && fileObj.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                                  return (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-border/50 inline-block">
                                      <img src={fileObj.url} alt={filename} className="max-w-[200px] max-h-[200px] object-cover" />
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ))}
                      
                      {(!isLoadingFullTask && (!fullTask?.comments || fullTask.comments.length === 0)) && (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-transparent rounded-xl border border-dashed border-border/50">No comments yet.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0">
                    <div className="space-y-4">
                      {/* Show activities, sort by createdAt */}
                      {isLoadingFullTask ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Loading activity...</div>
                      ) : (() => {
                        const activityItems = [
                          ...(fullTask?.activities || []).filter((a: any) => !a.action.startsWith("changed the description") && !a.action.startsWith("added a comment")).map((a: any) => ({ ...a, type: 'activity' }))
                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        
                        return (
                          <div className="space-y-3">
                            {activityItems.length === 0 && !fullTask?.createdAt ? (
                              <div className="text-sm text-muted-foreground text-center py-4 bg-transparent rounded-xl border border-dashed border-border/50">No activity yet.</div>
                            ) : (
                              <>
                                {fullTask?.createdAt && (
                                  <div className="flex gap-3 items-center text-sm py-1">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 shrink-0 flex items-center justify-center">
                                      <span className="text-[9px] font-bold text-primary">✦</span>
                                    </div>
                                    <div className="flex-1 text-muted-foreground">
                                      <span className="font-semibold text-foreground mr-1">Task</span>
                                      created
                                      <span className="text-[10px] ml-2 text-muted-foreground/70">• {format(new Date(fullTask.createdAt), "MMM d, h:mm a")}</span>
                                    </div>
                                  </div>
                                )}
                                {activityItems.map((item: any, idx: number) => {
                                  const isUpload = item.action.includes('uploaded a file');
                                  const matchingFile = (isUpload && item.details) ? task.files?.find((f: any) => f.name === item.details || f.url === item.details) : null;
                                  const isImage = matchingFile && (matchingFile.url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) || matchingFile.name?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i));
                                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                                  const proxyUrl = matchingFile ? `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(matchingFile.url.startsWith('http') ? matchingFile.url : `${backendUrl}/${matchingFile.url.replace(/^\/+/, '')}`)}&name=${encodeURIComponent(matchingFile.name)}&stream=true` : "";

                                  return (
                                    <div key={`a-${idx}`} className={`flex gap-3 items-start text-sm py-1 ${isImage ? 'mt-2 mb-2' : ''}`}>
                                      <Avatar className="w-6 h-6 border border-border/50 bg-muted shrink-0 text-[10px] mt-0.5">
                                        <AvatarFallback>{item.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 text-muted-foreground">
                                        <div>
                                          <span className="font-semibold text-foreground mr-1">{item.userName}</span>
                                          {item.action} {item.details && !isImage && <span className="font-medium text-foreground/80 ml-1 break-all">{item.details}</span>}
                                          <span className="text-[10px] ml-2 text-muted-foreground/70 whitespace-nowrap">• {format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                                        </div>
                                        {isImage && (
                                          <div className="mt-2">
                                            <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[250px] rounded-lg overflow-hidden border border-border/50 shadow-sm hover:opacity-90 transition-opacity bg-black/5">
                                              <img src={proxyUrl} alt={item.details} className="w-full h-auto object-cover max-h-[150px]" loading="lazy" />
                                            </a>
                                            <span className="text-[10px] text-muted-foreground mt-1 block truncate max-w-[250px]">{item.details}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
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
            
            <div 
              className={`p-4 border-y md:border-y-0 md:border-t border-border/50 shrink-0 transition-colors relative ${isDragOverComment ? 'bg-primary/10 border-primary border-dashed' : 'bg-transparent'}`}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverComment(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverComment(true); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverComment(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);
                    const token = (session as any)?.user?.token || localStorage.getItem('token') || "";
                    
                    const uploadPromises = files.map(async (file) => {
                      const id = Date.now().toString() + Math.random().toString(36).substring(7);
                      const abortController = new AbortController();
                      
                      addUpload({
                        id,
                        name: file.name,
                        tag: "Task Document",
                        taskId: task._id,
                        file,
                        abortController
                      });

                      try {
                        updateStatus(id, 'uploading');
                        const data = await uploadTaskFile(
                          token,
                          task._id,
                          file,
                          "Task Document",
                          (percent) => updateProgress(id, percent),
                          abortController
                        );
                        updateStatus(id, 'success');
                        return data;
                      } catch (err: any) {
                        if (err.name === 'AbortError') {
                          updateStatus(id, 'error', 'Upload cancelled');
                        } else {
                          updateStatus(id, 'error', err.message || 'Upload failed');
                        }
                        throw err;
                      }
                    });

                    toast.promise(Promise.all(uploadPromises), {
                      loading: `Uploading ${files.length} file(s)...`,
                      success: (uploadedData) => {
                        queryClient.invalidateQueries({ queryKey: ["taskFiles", task._id] });
                        
                        // Post a single comment with images/links
                        let commentBody = `Attached ${files.length} file(s):\n`;
                        uploadedData.forEach(d => {
                          if (d && d.url) {
                            const isImage = d.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                            if (isImage) {
                              commentBody += `![](${d.url})\n`;
                            } else {
                              commentBody += `[${d.originalName}](${d.url})\n`;
                            }
                          }
                        });
                        addComment({ id: task._id, text: commentBody });

                        return `Successfully uploaded ${files.length} file(s)`;
                      },
                      error: "Failed to upload some files"
                    });
                }
              }}
            >
              {isDragOverComment && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-b-lg"
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverComment(false); }}
                >
                  <div className="flex flex-col items-center gap-4 text-primary pointer-events-none p-6 rounded-2xl bg-background shadow-2xl border-2 border-primary/20">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">Drop files to attach to this task</p>
                      <p className="text-sm text-muted-foreground mt-1">Files will be uploaded and added as a comment</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="relative pt-6 border-t border-border/30 mt-6 bg-transparent p-4 rounded-xl">
                <div className="flex gap-2">
                <input 
                  type="file" 
                  id="task-file-upload" 
                  className="hidden" 
                  multiple
                  onChange={handleFileUpload}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon" 
                      className="shrink-0 shadow-sm"
                    >
                      <Paperclip className="w-4 h-4" />
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
          </div>
          
          {/* Sidebar (Right, 30% width) */}
          <div className="w-full md:w-[30%] bg-muted/10 p-4 md:p-6 space-y-6 shrink-0 md:overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Properties</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Assignee
                </label>
                <Select value={assignee} onValueChange={(v) => { setAssignee(v); handleSaveDetails({ assignee: v === "unassigned" ? null : v }); }}>
                  <SelectTrigger className="h-9 bg-background shadow-sm border-border/50">
                    <AssigneeTag user={allUsers.find((u: any) => u._id === assignee)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {allUsers.map((user: any) => (
                      <SelectItem key={user._id} value={user._id}>
                        <div className="flex items-center gap-2">
                          <AssigneeDot userId={user._id} />
                          {user.name || user.email}
                        </div>
                      </SelectItem>
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Link className="w-3.5 h-3.5" /> Link Order ID
                  </label>
                  {orderId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm" 
                      onClick={() => { navigator.clipboard.writeText(orderId); toast.success("Order ID copied"); }} 
                      title="Copy Order ID"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
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
                          {customOrderIds.map((id: string) => (
                             <CommandItem
                               key={`custom-${id}`}
                               value={id}
                               onSelect={() => {
                                 setOrderId(id);
                                 handleSaveDetails({ orderId: id });
                                 setOpenOrderBox(false);
                                 setOrderSearch("");
                               }}
                             >
                               <Check className={cn("mr-2 h-4 w-4", orderId === id ? "opacity-100" : "opacity-0")} />
                               <span className="text-muted-foreground italic truncate">Order #{id} (From Uploads)</span>
                             </CommandItem>
                           ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Link className="w-3.5 h-3.5" /> Link Username
                  </label>
                  {customerUsername && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm" 
                      onClick={() => { navigator.clipboard.writeText(customerUsername); toast.success("Username copied"); }} 
                      title="Copy Username"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
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
                          {customUsernames.map((username: string) => (
                             <CommandItem
                               key={`custom-${username}`}
                               value={username}
                               onSelect={() => {
                                 setCustomerUsername(username);
                                 handleSaveDetails({ customerUsername: username });
                                 setOpenUserBox(false);
                                 setUserSearch("");
                               }}
                             >
                               <Check className={cn("mr-2 h-4 w-4", customerUsername === username ? "opacity-100" : "opacity-0")} />
                               <span className="text-muted-foreground italic truncate">{username} (From Uploads)</span>
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
      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
    </Dialog>
  );
}
