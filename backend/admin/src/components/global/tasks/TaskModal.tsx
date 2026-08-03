/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTask, useUpdateTask, useAddTaskComment, useUploadTaskFile, useDeleteTaskFile, useUpdateTaskFileNotes, useDeleteTaskComment, usePinTaskComment } from "@/hooks/useTasks";
import { useUploadStore } from '@/store/uploadStore';
import { useUsers } from "@/hooks/useUsers";
import { Calendar, User, Link, Send, MessageSquare, Paperclip, File, LoaderCircle, Trash2, Tag, Share2, Pin, X, AlertCircle, RefreshCw, CheckCircle, Folder, Printer } from "lucide-react";
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
import { useCreateShareLink, useFilesByFolder, useResolveFileByPath } from "@/hooks/useAdminDashboard";
import { useRouter } from "next/navigation";
import { AssigneeTag, AssigneeDot } from "@/lib/userColor";
import { buildFileShareUrl, isPdfFile, preparePdfSharePreview } from "@/lib/fileSharePreview";

const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal, allFiles }: any) => {
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

  const { mutateAsync: resolveFileByPath, isPending: isResolvingShareLink } = useResolveFileByPath();
  const matchedFile = allFiles?.find((candidate: any) =>
    candidate.path === file.url || (file.url && file.url.includes(candidate.filename))
  );
  const knownFileId = matchedFile?._id || matchedFile?.id;
  const isPdf = isPdfFile({
    mimetype: file.mimetype || matchedFile?.mimetype,
    name: file.name,
  });

  const prepareSharePreview = () => {
    if (!isPdf || !knownFileId) return;
    void preparePdfSharePreview(knownFileId).catch(() => {});
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let realFileId = knownFileId;

    if (!realFileId) {
      // The local lookup failed — usually because the upload-time sync to
      // the FileUpload collection silently failed for this file. Rather
      // than fall back to an id that doesn't exist in that collection
      // (which just produces a dead "File Not Found" link), resolve or
      // create the record on the spot so the link always works.
      try {
        const res = await resolveFileByPath({
          path: file.url,
          name: file.name,
          mimetype: file.mimetype,
          taskId: task._id,
          orderId: task.orderId,
          tag: file.tag,
        });
        realFileId = res?.data?._id;
      } catch (err) {
        toast.error("Cannot generate share link: failed to resolve file record.");
        return;
      }
    }

    if (!realFileId) {
       toast.error("Cannot generate share link: File ID not found in database.");
       return;
    }

    const toastId = isPdf ? toast.loading("Preparing PDF preview...") : undefined;
    let previewReady = true;
    if (isPdf) {
      try {
        await preparePdfSharePreview(realFileId);
      } catch {
        previewReady = false;
      }
    }

    try {
      await navigator.clipboard.writeText(buildFileShareUrl(window.location.origin, realFileId, isPdf));
      const options = toastId !== undefined ? { id: toastId } : undefined;
      if (previewReady) toast.success("Share link copied with preview ready", options);
      else toast.warning("Share link copied, but the PDF preview may take longer", options);
    } catch {
      toast.error("Failed to copy share link", toastId !== undefined ? { id: toastId } : undefined);
    }
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
          <File className="w-4 h-4 text-primary/80 relative z-10" aria-label="Attachment" />
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
                onPointerEnter={prepareSharePreview}
                onFocus={prepareSharePreview}
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
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: addComment, isPending: isCommenting } = useAddTaskComment();
  const { mutate: deleteCommentApi, isPending: isDeletingComment } = useDeleteTaskComment();
  const { mutate: pinCommentApi, isPending: isPinningComment } = usePinTaskComment();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadTaskFile();
  const { mutate: deleteFile, isPending: isDeletingFile } = useDeleteTaskFile();
  const [openOrderBox, setOpenOrderBox] = useState(false);
  const [openUserBox, setOpenUserBox] = useState(false);
  const { data: usersData } = useUsers();
  const { data: ordersData } = useOrders(openOrderBox);
  // Loading every uploaded file when a task opens can exhaust mobile browser
  // memory. This endpoint returns only files attached to this task.
  const { data: taskFilesData } = useFilesByFolder({ taskId: task._id });
  const { data: fullTaskData } = useTask(task._id);
  const { mutateAsync: createShareLink, isPending: isGeneratingLink } = useCreateShareLink();
  const router = useRouter();

  // Full task from single-task API (includes activities and comments),
  // falls back to the prop task from the list (which excludes activities).
  const fullTask = (fullTaskData as any)?.task || task;

  const admins = usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'].includes(u.role)) || [];
  const customers = usersData?.users?.filter((u: any) => u.role === 'client') || [];
  const allUsers = usersData?.users || [];
  const orders = ordersData?.orders || [];
  
  const uploadTagRef = React.useRef<string>('attachment');
  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const [description, setDescription] = useState(task.description || "");
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOverModal, setIsDragOverModal] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[] | null>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const { uploads, addUpload, updateProgress, updateStatus, removeUpload } = useUploadStore();
  const uploadingFiles = Object.values(uploads).filter(u => 
    u.taskId === task._id && 
    (u.status === 'uploading' || u.status === 'error' || 
      (u.status === 'success' && !fullTask.files?.some((cf: any) => cf.name === u.name)))
  );
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);

  const taskFiles = (taskFilesData as any)?.data || [];

  const combinedFiles = React.useMemo(() => {
    let files = [...(fullTask?.files || [])];
    
    const uploadedTaskFiles = taskFiles.filter((f: any) => {
      // Don't duplicate files already included by the task API.
      return !files.some(tf => tf.url === f.path || (tf.name && f.originalName && tf.name === f.originalName));
    }).map((f: any) => ({
      url: f.path,
      name: f.originalName || f.filename,
      mimetype: f.mimetype,
      notes: f.notes || f.adminNotes, // Make sure to sync notes
      tag: f.tag || 'customer_upload',
      _id: f._id
    }));
    
    return [...files, ...uploadedTaskFiles].filter(f => {
      const fid = f._id || f.url?.split('/').pop();
      return !deletedFileIds.includes(fid);
    });
  }, [fullTask, taskFiles, deletedFileIds]);

  const handleDownloadAllAttachments = () => {
    if (!combinedFiles || combinedFiles.length === 0) return;
    toast.success(`Downloading ${combinedFiles.length} file(s)...`);
    combinedFiles.forEach((file: any, index: number) => {
      setTimeout(() => {
        forceDownload(file.url, file.name);
      }, index * 300);
    });
  };

  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [orderId, setOrderId] = useState(task.orderId || "");
  const [customerUsername, setCustomerUsername] = useState(task.customerUsername || "");
  const [category, setCategory] = useState(task.category || "UNASSIGNED");
  const [status, setStatus] = useState(task.status || "PLACED");
  const [title, setTitle] = useState(task.title || "");
  const getAssigneeId = (val: any) => typeof val === 'object' && val !== null ? val._id : (val || "unassigned");
  const [assignee, setAssignee] = useState(getAssigneeId(task.assignee));
  const editingFieldRef = React.useRef<string | null>(null);
  const titleOnFocusRef = React.useRef(title);
  const descriptionOnFocusRef = React.useRef(description);
  const dueDateOnFocusRef = React.useRef(dueDate);

  React.useEffect(() => {
    setStatus(fullTask.status || "PLACED");
  }, [fullTask.status]);

  React.useEffect(() => {
    if (editingFieldRef.current !== 'title') setTitle(fullTask.title || "");
  }, [fullTask.title]);

  React.useEffect(() => {
    if (editingFieldRef.current !== 'description') setDescription(fullTask.description || "");
  }, [fullTask.description]);

  React.useEffect(() => {
    if (editingFieldRef.current !== 'dueDate') {
      setDueDate(fullTask.dueDate ? new Date(fullTask.dueDate).toISOString().split('T')[0] : "");
    }
  }, [fullTask.dueDate]);

  React.useEffect(() => setOrderId(fullTask.orderId || ""), [fullTask.orderId]);
  React.useEffect(() => setCustomerUsername(fullTask.customerUsername || ""), [fullTask.customerUsername]);
  React.useEffect(() => setCategory(fullTask.category || "UNASSIGNED"), [fullTask.category]);
  React.useEffect(() => setAssignee(getAssigneeId(fullTask.assignee)), [fullTask.assignee]);

  const handleSaveDetails = (data: Record<string, any>) => {
    updateTask({
      id: task._id,
      data,
    }, {
      onSuccess: () => toast.success("Task details updated!"),
      onError: () => {
        if ('title' in data) setTitle(fullTask.title || "");
        if ('description' in data) setDescription(fullTask.description || "");
        if ('dueDate' in data) setDueDate(fullTask.dueDate ? new Date(fullTask.dueDate).toISOString().split('T')[0] : "");
        if ('orderId' in data) setOrderId(fullTask.orderId || "");
        if ('customerUsername' in data) setCustomerUsername(fullTask.customerUsername || "");
        if ('category' in data) setCategory(fullTask.category || "UNASSIGNED");
        if ('status' in data) setStatus(fullTask.status || "PLACED");
        if ('assignee' in data) setAssignee(getAssigneeId(fullTask.assignee));
      },
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment({ id: task._id, text: commentText }, {
      onSuccess: () => setCommentText("")
    });
  };

  const [shareTarget, setShareTarget] = useState<{
    folderName: string;
    taskId?: string;
    orderId?: string;
  } | null>(null);

  const handleShareLink = () => {
    setShareTarget({
      folderName: fullTask.title || task.title,
      taskId: task._id,
      orderId: fullTask.orderId || task.orderId || undefined,
    });
  };

  const handleAudienceShare = async (audience: "CUSTOMER" | "SUPPLIER") => {
    if (!shareTarget) return;
    try {
      const res = await createShareLink({ ...shareTarget, audience });
      const slug = res?.data?.slug;
      if (!slug) {
        toast.error("Failed to generate share link");
        return;
      }
      const link = `${window.location.origin}/share/${slug}`;
      await navigator.clipboard.writeText(link);
      setShareTarget(null);
      toast.success(`${audience === "CUSTOMER" ? "Customer" : "Supplier"} share link copied`);
    } catch (e) {
      toast.error("Failed to generate share link");
    }
  };

  const uploadDroppedFiles = (files: File[], tag: string) => {
    const uploadPromises = files.map(async (file) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const abortController = new AbortController();

      addUpload({
        id,
        name: file.name,
        tag,
        taskId: task._id,
        file,
        abortController
      });

      try {
        updateStatus(id, 'uploading');
        const data = await uploadFile({
          id: task._id,
          file,
          tag,
          onProgress: (percent) => updateProgress(id, percent),
          abortController,
        });
        updateStatus(id, 'success');
        setTimeout(() => removeUpload(id), 1000);
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
      success: () => `Successfully uploaded ${files.length} file(s)`,
      error: "Failed to upload some files"
    });

    const fileNames = files.map(f => f.name).join(', ');
    addComment({ id: task._id, text: `Attached ${files.length} file(s): ${fileNames}` });
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
          setTimeout(() => removeUpload(id), 1000);
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
      setTimeout(() => removeUpload(upload.id), 1000);
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
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="task-modal-content top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[1200px] w-[95vw] md:w-[95vw] p-0 overflow-hidden bg-background border-border shadow-xl max-h-[85vh] flex flex-col"
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverModal(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverModal(true); }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // relatedTarget is where the pointer is going. If it's still
          // somewhere inside this dialog, ignore the leave — this only
          // fires because the pointer crossed a child element boundary,
          // not because it actually left the dialog.
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragOverModal(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOverModal(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setPendingDropFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        {isDragOverModal && (
          <div
            className="absolute inset-0 z-[70] flex items-center justify-center bg-background/85 backdrop-blur-sm border-2 border-primary border-dashed rounded-lg pointer-events-none"
          >
            <div className="flex flex-col items-center gap-3">
              <DownloadIcon className="w-10 h-10 text-primary animate-bounce" />
              <p className="text-lg font-bold text-primary">Drop files to attach to this task</p>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row h-full min-h-0 overflow-y-auto md:overflow-hidden">
          
          {/* Main Content (Left, 70% width) */}
          <div className="flex-none md:w-[70%] flex flex-col md:border-r border-border/50 bg-background min-h-0 shrink-0 md:shrink">
            <div className="p-4 md:p-6 border-b border-border/50 shrink-0">
              <DialogHeader>
                <DialogTitle className="sr-only">Task Details</DialogTitle>
                <DialogDescription className="sr-only">Dialog Content</DialogDescription>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onFocus={() => {
                      editingFieldRef.current = 'title';
                      titleOnFocusRef.current = title;
                    }}
                    onBlur={() => {
                      editingFieldRef.current = null;
                      if (title !== titleOnFocusRef.current) handleSaveDetails({ title });
                      else setTitle(fullTask.title || "");
                    }}
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
                  onFocus={() => {
                    editingFieldRef.current = 'description';
                    descriptionOnFocusRef.current = description;
                  }}
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
                  onBlur={() => {
                    editingFieldRef.current = null;
                    if (description !== descriptionOnFocusRef.current) handleSaveDetails({ description });
                    else setDescription(fullTask.description || "");
                  }}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments {combinedFiles.length > 0 && <span className="text-xs text-muted-foreground font-normal">({combinedFiles.length})</span>}
                    </label>
                    {fullTask.status === "IN_PRODUCTION" ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/admin/production?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors shadow-sm" title="Go to Production Folder">
                          <Folder className="w-3.5 h-3.5" />
                          Production Folder
                        </a>
                        <button
                          type="button"
                          onClick={handleDownloadAllAttachments}
                          disabled={!combinedFiles || combinedFiles.length === 0}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          title="Download all attachments"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          Download All
                        </button>
                        <button
                          type="button"
                          disabled={isGeneratingLink}
                          onClick={() => handleShareLink()}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                          title="Copy customer upload link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {isGeneratingLink ? "Generating..." : "Share Link"}
                        </button>
                      </div>
                    ) : fullTask.status === "PACKAGING" || fullTask.status === "SHIPPED" || fullTask.status === "DELIVERED" ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/admin/packaging?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors shadow-sm" title="Go to Packaging Folder">
                          <Folder className="w-3.5 h-3.5" />
                          Packaging Folder
                        </a>
                        <button
                          type="button"
                          onClick={handleDownloadAllAttachments}
                          disabled={!combinedFiles || combinedFiles.length === 0}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          title="Download all attachments"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          Download All
                        </button>
                        <button
                          type="button"
                          disabled={isGeneratingLink}
                          onClick={() => handleShareLink()}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                          title="Copy customer upload link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {isGeneratingLink ? "Generating..." : "Share Link"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/admin/artworks?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors shadow-sm" title="Go to Artwork Folder">
                          <Folder className="w-3.5 h-3.5" />
                          Artwork Folder
                        </a>
                        <button
                          type="button"
                          onClick={handleDownloadAllAttachments}
                          disabled={!combinedFiles || combinedFiles.length === 0}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          title="Download all attachments"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          Download All
                        </button>
                        <button
                          type="button"
                          disabled={isGeneratingLink}
                          onClick={() => handleShareLink()}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                          title="Copy customer upload link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {isGeneratingLink ? "Generating..." : "Share Link"}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {combinedFiles.length === 0 && uploadingFiles.length === 0 ? (
                    <div className="p-4 border border-dashed border-border/60 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                      No files attached to this task yet. Upload files below or click Share Link to send an upload portal link to the customer.
                    </div>
                  ) : (
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
                        <FileAttachmentCard allFiles={taskFiles} key={file.url}
                          task={fullTask}
                          file={file} 
                          deleteFile={deleteFile} 
                          isDeletingFile={isDeletingFile} 
                          onPreview={setPreviewFile}
                          onDeleteLocal={(fid: string) => setDeletedFileIds(prev => [...prev, fid])}
                        />
                      ))}
                    </div>
                  )}
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

                  <TabsContent value="comments" className="mt-0 bg-transparent" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" translate="no">
                    <div className="space-y-4 bg-transparent">
                      {[...(fullTask.comments || [])].sort((a: any, b: any) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      }).map((comment: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="text-xs" style={{ background: 'transparent' }}>{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
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
                            <p className={`text-sm leading-relaxed ${comment.pinned ? 'font-bold text-foreground' : 'text-foreground'}`}>{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      {(!fullTask.comments || fullTask.comments.length === 0) && (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-transparent">No comments yet.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0 bg-transparent" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" translate="no">
                    <div className="space-y-4 bg-transparent">
                      {/* Show activities, sort by createdAt */}
                      {(() => {
                        const activityItems = [
                          ...(fullTask.activities || []).filter((a: any) => !a.action.startsWith("added a comment")).map((a: any) => ({ ...a, type: 'activity' }))
                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        
                        return (
                          <div className="space-y-3 bg-transparent">
                            {activityItems.length === 0 && !fullTask.createdAt ? (
                              <div className="text-sm text-muted-foreground text-center py-4 bg-transparent">No activity yet.</div>
                            ) : (
                              <>
                                {fullTask.createdAt && (
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
                                  const isDoneActivity = item.action === 'marked task as done';
                                  const matchingFile = (isUpload && item.details) ? fullTask.files?.find((f: any) => f.name === item.details || f.url === item.details) : null;
                                  const isImage = matchingFile && (matchingFile.url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) || matchingFile.name?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i));
                                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                                  const proxyUrl = matchingFile ? `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(matchingFile.url.startsWith('http') ? matchingFile.url : `${backendUrl}/${matchingFile.url.replace(/^\/+/, '')}`)}&name=${encodeURIComponent(matchingFile.name)}&stream=true` : "";
                                  let rawUrl = "";
                                  if (matchingFile) {
                                    rawUrl = matchingFile.url.startsWith('http') ? matchingFile.url : `${backendUrl}/${matchingFile.url.replace(/^\/+/, '')}`;
                                  }
                                  const thumbUrl = rawUrl ? `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=200&h=200&fit=cover` : "";

return (
                                      <div key={`a-${idx}`} className={`flex gap-3 items-start text-sm py-1 ${isImage ? 'mt-2 mb-2' : ''}`}>
                                      <Avatar className="w-6 h-6 shrink-0 text-[10px] mt-0.5">
                                        <AvatarFallback style={{ background: 'transparent' }}>{item.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
<div className="flex-1 text-muted-foreground">
                                        <div>
                                          <span className="font-semibold text-foreground mr-1">{item.userName}</span>
                                          {isDoneActivity && <CheckCircle className="inline-block w-4 h-4 mr-1.5 text-emerald-500 align-text-bottom" />}
                                          {item.action} {item.details && !isImage && <span className="font-medium text-foreground/80 ml-1 break-all">{item.details}</span>}
                                          <span className="text-[10px] ml-2 text-muted-foreground/70 whitespace-nowrap">• {format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                                        </div>
                                        {isImage && (
                                          <div className="mt-2">
                                            <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[250px] rounded-lg overflow-hidden border border-border/50 shadow-sm hover:opacity-90 transition-opacity bg-black/5">
                                              <img src={thumbUrl} alt={item.details} className="w-full h-auto object-cover max-h-[150px]" loading="lazy" />
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
              className="p-4 border-y md:border-y-0 md:border-t border-border/50 shrink-0 bg-muted/10 dark:bg-transparent"
            >
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
          
          {/* Sidebar (Right, 30% width) */}
          <div className="w-full md:w-[30%] bg-muted/10 p-4 md:p-6 space-y-6 min-h-0 md:overflow-y-auto">
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
                        'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING',
                        'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN'
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
                  onFocus={() => {
                    editingFieldRef.current = 'dueDate';
                    dueDateOnFocusRef.current = dueDate;
                  }}
                  onBlur={() => {
                    editingFieldRef.current = null;
                    if (dueDate !== dueDateOnFocusRef.current) {
                      handleSaveDetails({ dueDate: dueDate ? new Date(dueDate) : null });
                    } else setDueDate(fullTask.dueDate ? new Date(fullTask.dueDate).toISOString().split('T')[0] : "");
                  }}
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
        {pendingDropFiles && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingDropFiles(null)}>
            <div className="bg-background border border-border rounded-xl shadow-2xl w-[90vw] max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-base mb-1">Upload {pendingDropFiles.length} file{pendingDropFiles.length > 1 ? 's' : ''}</h3>
              <p className="text-sm text-muted-foreground mb-4">What type of file is this?</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start h-11"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'draft'); setPendingDropFiles(null); }}
                >
                  <Badge className="bg-orange-500 mr-2 text-[10px]">Draft</Badge> Upload as Draft
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-11"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'attachment'); setPendingDropFiles(null); }}
                >
                  <Badge className="bg-gray-500 mr-2 text-[10px]">Attachment</Badge> Upload as Attachment
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-11"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'for_print'); setPendingDropFiles(null); }}
                >
                  <Badge className="bg-green-500 mr-2 text-[10px]">Artwork</Badge> Upload as Artwork (For Print)
                </Button>
              </div>
              <Button variant="ghost" className="w-full mt-3 text-muted-foreground" onClick={() => setPendingDropFiles(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
    </Dialog>

    <Dialog open={Boolean(shareTarget)} onOpenChange={(open) => { if (!open) setShareTarget(null); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choose Share Link Audience</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          The selected audience controls which files and folders can be accessed through this link.
        </p>
        <div className="grid gap-3 py-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 text-left transition hover:border-blue-500/60 hover:bg-blue-500/10 disabled:opacity-50"
            disabled={isGeneratingLink}
            onClick={() => handleAudienceShare("CUSTOMER")}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white">
              <User className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground">Send to Customer</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Shows root Draft and Attachment files only. Subfolders and For Print are hidden.</p>
          </button>
          <button
            type="button"
            className="rounded-2xl border border-lime-500/30 bg-lime-500/5 p-5 text-left transition hover:border-lime-500/70 hover:bg-lime-500/10 disabled:opacity-50"
            disabled={isGeneratingLink}
            onClick={() => handleAudienceShare("SUPPLIER")}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-lime-400 text-black">
              <Printer className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground">Send to Supplier</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Shows For Print files only, including files organised inside subfolders.</p>
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShareTarget(null)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
