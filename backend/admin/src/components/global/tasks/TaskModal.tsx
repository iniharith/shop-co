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
import { useTask, useUpdateTask, useAddTaskComment, useUploadTaskFile, useDeleteTaskFile, useUpdateTaskFileNotes, useDeleteTaskComment, usePinTaskComment } from "@/hooks/useTasks";
import { useUploadStore } from '@/store/uploadStore';
import { useUsers } from "@/hooks/useUsers";
import { Calendar, User, Link, Send, MessageSquare, Paperclip, File, LoaderCircle, Trash2, Tag, Share2, Pin, X, AlertCircle, RefreshCw, CheckCircle, Folder, Printer, GripVertical, MoveDiagonal, RotateCcw, FolderInput, FolderOpen, ChevronDown, Files, Truck } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/useOrder";
import { TASK_CATEGORIES } from "@/constants/taskCategories";
import { FilePreviewModal } from "@/components/global/FilePreviewModal";
import { Check, ChevronsUpDown, Download as DownloadIcon, Copy } from "lucide-react";
import { cn, forceDownload } from "@/lib/utils";
import { useCreateShareLink, useFilesByFolder, useResolveFileByPath, useFolders, useMoveFile } from "@/hooks/useAdminDashboard";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AssigneeTag, AssigneeDot } from "@/lib/userColor";
import { buildFileShareUrl, isPdfFile, preparePdfSharePreview } from "@/lib/fileSharePreview";
import { getSocket } from "@/utils/socket";
import { useTaskTypingStore } from "@/store/taskTypingStore";

const TASK_MODAL_VIEW_KEY = "taskModalView:v1";

type TaskModalView = { x: number; y: number; w?: number; h?: number };

const loadTaskModalView = (): TaskModalView | null => {
  try {
    const raw = localStorage.getItem(TASK_MODAL_VIEW_KEY);
    return raw ? (JSON.parse(raw) as TaskModalView) : null;
  } catch {
    return null;
  }
};

const saveTaskModalView = (view: TaskModalView) => {
  try {
    localStorage.setItem(TASK_MODAL_VIEW_KEY, JSON.stringify(view));
  } catch {
    // storage unavailable — ignore
  }
};

const clearTaskModalView = () => {
  try {
    localStorage.removeItem(TASK_MODAL_VIEW_KEY);
  } catch {
    // storage unavailable — ignore
  }
};

const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal, allFiles, folders, moveFile }: any) => {
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

    try {
      await navigator.clipboard.writeText(buildFileShareUrl(window.location.origin, realFileId, isPdf));
      toast.success(isPdf ? "Share link copied; PDF preview is warming in the background" : "Share link copied");
      if (isPdf) void preparePdfSharePreview(realFileId).catch(() => {});
    } catch {
      toast.error("Failed to copy share link");
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
          ) : file.tag === 'awb' ? (
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">AWB</div>
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
              {folders && folders.length > 0 && file._id && moveFile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-5 h-5 shrink-0 text-amber-300 hover:text-amber-400 hover:bg-white/10 rounded-full ml-0.5"
                      title="Move to folder"
                    >
                      <FolderInput className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                    <DropdownMenuItem onClick={() => moveFile(file._id, null)}>
                      <X className="w-3.5 h-3.5 mr-2" /> No folder
                    </DropdownMenuItem>
                    {folders.map((folder: any) => (
                      <DropdownMenuItem key={folder._id} onClick={() => moveFile(file._id, folder._id)}>
                        <Folder className="w-3.5 h-3.5 mr-2" fill="currentColor" /> {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
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

  const { data: foldersData } = useFolders();
  const { mutateAsync: moveFile, isPending: isMovingFile } = useMoveFile();
  const taskFolders = ((foldersData as any)?.data || []).filter((f: any) => f.taskId === task._id);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});
  const [ungroupedOpen, setUngroupedOpen] = useState<Record<string, boolean>>({ artworks: true, attachments: true });
  const [pendingDropFolderId, setPendingDropFolderId] = useState<string | null>(null);
  const uploadFolderIdRef = React.useRef<string | null>(null);

  const toggleFolder = (id: string) => {
    setExpandedFolderIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMoveFile = async (fileId: string, folderId: string | null) => {
    try {
      await moveFile({ fileId, folderId });
      toast.success(folderId ? "File moved to folder" : "File moved to ungrouped");
    } catch {
      toast.error("Failed to move file");
    }
  };

  const combinedFiles = React.useMemo(() => {
    // The task API embeds files in task.files without a folderId, while the
    // FileUpload records (taskFiles) carry the authoritative folderId. Enrich
    // the embedded entries with the matching FileUpload's folderId/_id so
    // files group into their assigned folder instead of falling to Ungrouped.
    const enriched = (fullTask?.files || []).map((tf: any) => {
      const match = taskFiles.find((f: any) => f.path === tf.url || (tf.name && f.originalName && tf.name === f.originalName));
      return match ? { ...tf, _id: match._id, folderId: match.folderId, createdAt: tf.createdAt || match.createdAt || match.uploadedAt } : tf;
    });

    const uploadedTaskFiles = taskFiles.filter((f: any) => {
      // Don't duplicate files already included by the task API.
      return !enriched.some(tf => tf.url === f.path || (tf.name && f.originalName && tf.name === f.originalName));
    }).map((f: any) => ({
      url: f.path,
      name: f.originalName || f.filename,
      mimetype: f.mimetype,
      notes: f.notes || f.adminNotes, // Make sure to sync notes
      tag: f.tag || 'customer_upload',
      _id: f._id,
      folderId: f.folderId,
      createdAt: f.createdAt || f.uploadedAt
    }));
    
    return [...enriched, ...uploadedTaskFiles].filter(f => {
      const fid = f._id || f.url?.split('/').pop();
      return !deletedFileIds.includes(fid);
    }).sort((a: any, b: any) => {
      // Order: Draft -> For Print -> Attachments oldest first, then newest.
      const tagPriority = (tag: string) => tag === 'draft' ? 0 : tag === 'for_print' ? 1 : 2;
      const time = (f: any) => (f.createdAt ? new Date(f.createdAt).getTime() : 0);
      const pa = tagPriority(a.tag);
      const pb = tagPriority(b.tag);
      if (pa !== pb) return pa - pb;
      // Within the same group: attachments go oldest-first; Draft and For
      // Print stay newest-first.
      const direction = pa === 2 ? 1 : -1;
      return direction * (time(b) - time(a));
    });
  }, [fullTask, taskFiles, deletedFileIds]);

  const artworkFiles = React.useMemo(
    () => combinedFiles.filter((file: any) => file.tag === 'draft' || file.tag === 'for_print'),
    [combinedFiles]
  );
  const attachmentFiles = React.useMemo(
    () => combinedFiles.filter((file: any) => file.tag !== 'draft' && file.tag !== 'for_print'),
    [combinedFiles]
  );
  const artworkUploads = uploadingFiles.filter(file => file.tag === 'draft' || file.tag === 'for_print');
  const attachmentUploads = uploadingFiles.filter(file => file.tag !== 'draft' && file.tag !== 'for_print');

  // Auto-detect the AWB file uploaded to this task so the Quick Links panel
  // can show a live preview of it above the Done button.
  const awbFile = React.useMemo(() => combinedFiles.find((f: any) => f.tag === 'awb'), [combinedFiles]);
  const awbPreviewUrl = React.useMemo(() => {
    if (!awbFile) return "";
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const raw = awbFile.url.startsWith('http') ? awbFile.url : `${backendBase}/${String(awbFile.url).replace(/^\/+/, '')}`;
    return raw.replace(/\\/g, '/');
  }, [awbFile]);
  const awbIsImage = !!awbFile && (awbFile.mimetype?.includes("image") || (awbFile.name || awbFile.url || "").match(/\.(jpeg|jpg|gif|png|webp|heic)$/i));
  const awbIsPdf = !!awbFile && isPdfFile({ mimetype: awbFile.mimetype, name: awbFile.name || awbFile.url });
  const awbProxyUrl = React.useMemo(() => {
    if (!awbFile || !awbPreviewUrl) return "";
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    return `${backendBase}/api/files/proxy-download?url=${encodeURIComponent(awbPreviewUrl)}&name=${encodeURIComponent(awbFile.name || 'AWB')}&inline=true#toolbar=0`;
  }, [awbFile, awbPreviewUrl]);

  const handleDownloadFiles = (files: any[], label: string) => {
    if (files.length === 0) return;
    toast.success(`Downloading ${files.length} ${label.toLowerCase()} file(s)...`);
    files.forEach((file: any, index: number) => {
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
  const descriptionRef = React.useRef<HTMLDivElement>(null);
  const dueDateOnFocusRef = React.useRef(dueDate);
  const { data: session } = useSession();
  const sessionUser = (session?.user as any) || null;
  const myUserId = sessionUser?.id as string | undefined;
  const typingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = React.useRef(0);
  const descriptionFocusActiveRef = React.useRef(false);
  const typingKeepAliveRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const emitTyping = React.useCallback((text: string, stopped?: boolean) => {
    const socket = session ? getSocket(session) : null;
    if (!socket) return;
    socket.emit("task_typing", {
      taskId: task._id,
      field: "description",
      text: stopped ? undefined : text,
      stopped: stopped || undefined,
    });
  }, [task._id, session]);

  // Always emit with the latest callback so the keep-alive interval never
  // captures a stale task/session.
  const emitTypingRef = React.useRef(emitTyping);
  React.useEffect(() => {
    emitTypingRef.current = emitTyping;
  }, [emitTyping]);

  const stopTypingKeepAlive = () => {
    if (typingKeepAliveRef.current) {
      clearInterval(typingKeepAliveRef.current);
      typingKeepAliveRef.current = null;
    }
  };

  // Re-broadcast the current draft every 3s while the editor stays focused so
  // other viewers' 5s indicator TTL never expires mid-edit (e.g. long pauses).
  const ensureTypingKeepAlive = () => {
    if (typingKeepAliveRef.current) return;
    typingKeepAliveRef.current = setInterval(() => {
      if (!descriptionFocusActiveRef.current) return;
      emitTypingRef.current(descriptionRef.current?.innerHTML || "");
    }, 3000);
  };

  // Throttled live-typing broadcast while the description is being edited.
  const handleDescriptionInput = React.useCallback((html: string) => {
    setDescription(html);
    const now = Date.now();
    const emit = () => {
      lastTypingEmitRef.current = Date.now();
      emitTyping(html);
    };
    if (now - lastTypingEmitRef.current >= 150) {
      emit();
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(emit, 150);
    }
    ensureTypingKeepAlive();
  }, [emitTyping]);

  const handleDescriptionPaste = React.useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!event.currentTarget.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleDescriptionInput(event.currentTarget.innerHTML);
  }, [handleDescriptionInput]);

  const typingInfo = useTaskTypingStore((s) => s.typing[task._id]);

  // Asana-style live preview: apply the other user's typed text to the
  // contentEditable while they type, but never clobber my own draft.
  React.useEffect(() => {
    if (!typingInfo?.text) return;
    if (editingFieldRef.current === 'description') return;
    if (descriptionRef.current && descriptionRef.current.dataset.descriptionInit) {
      descriptionRef.current.innerHTML = typingInfo.text;
    }
  }, [typingInfo?.text, typingInfo?.at]);

  // Revert the live preview to the saved value once the stream stops.
  React.useEffect(() => {
    if (typingInfo) return;
    if (editingFieldRef.current === 'description') return;
    if (descriptionFocusActiveRef.current) return;
    if (descriptionRef.current && descriptionRef.current.dataset.descriptionInit) {
      const saved = fullTask.description || "";
      if (descriptionRef.current.innerHTML !== saved) {
        descriptionRef.current.innerHTML = saved;
        setDescription(saved);
      }
    }
  }, [typingInfo, fullTask.description]);

  // Clean up typing timers/stream when the modal closes.
  React.useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      stopTypingKeepAlive();
      useTaskTypingStore.getState().clearTyping(task._id);
    };
  }, [task._id]);

  React.useEffect(() => {
    setStatus(fullTask.status || "PLACED");
  }, [fullTask.status]);

  React.useEffect(() => {
    if (editingFieldRef.current !== 'title') setTitle(fullTask.title || "");
  }, [fullTask.title]);

  React.useEffect(() => {
    if (editingFieldRef.current !== 'description') {
      const html = fullTask.description || "";
      setDescription(html);
      if (descriptionRef.current) descriptionRef.current.innerHTML = html;
    }
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
        if ('description' in data) {
          const fb = fullTask.description || "";
          setDescription(fb);
          if (descriptionRef.current) descriptionRef.current.innerHTML = fb;
        }
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

  const uploadDroppedFiles = (files: File[], tag: string, folderId?: string | null) => {
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
          folderId: folderId || undefined,
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
        const folderId = uploadFolderIdRef.current;
        const abortController = new AbortController();
        
        addUpload({ id, name: file.name, tag, taskId: task._id, file, abortController });
        
        uploadFile({ 
          id: task._id, 
          file, 
          tag, 
          folderId: folderId || undefined,
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

  // Window management: move + resize the full-view task dialog
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const winPosRef = React.useRef({ x: 0, y: 0 });
  const winSizeRef = React.useRef<{ w: number; h: number } | null>(null);
  const dragStateRef = React.useRef<{ mode: 'move' | 'resize'; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number; rafId: number | null } | null>(null);

  // Drag-and-drop is handled from a single window-level dragover listener
  // instead of React dragenter/dragleave pairs. dragenter/dragleave fire
  // erratically when the pointer crosses nested children, which made the
  // drop overlay flicker and the folder highlight get stuck. Tracking the
  // pointer position here is stable: dropFolderId comes from the element
  // under the cursor, and the overlay only shows while the pointer is inside
  // the dialog and not over a folder.
  React.useEffect(() => {
    const resetDrag = () => {
      setIsDragOverModal(false);
      setDropFolderId(null);
    };
    const onWindowDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) {
        resetDrag();
        return;
      }
      e.preventDefault();
      const el = dialogRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const insideDialog =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      const underPointer = document.elementFromPoint(e.clientX, e.clientY);
      const folderCard = underPointer instanceof Element ? underPointer.closest('[data-folder-id]') : null;
      const folderId = folderCard?.getAttribute('data-folder-id') || null;
      setDropFolderId(folderId);
      setIsDragOverModal(insideDialog && !folderId);
    };
    const onLeaveWindow = (e: DragEvent) => {
      if (e.target === document.documentElement) resetDrag();
    };
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('drop', resetDrag);
    window.addEventListener('dragend', resetDrag);
    document.addEventListener('dragleave', onLeaveWindow);
    return () => {
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('drop', resetDrag);
      window.removeEventListener('dragend', resetDrag);
      document.removeEventListener('dragleave', onLeaveWindow);
    };
  }, []);

  const applyWindowDrag = () => {
    const s = dragStateRef.current;
    const el = dialogRef.current;
    if (!s || !el) return;
    s.rafId = null;
    if (s.mode === 'move') {
      const p = winPosRef.current;
      el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`;
    } else {
      const sz = winSizeRef.current;
      if (sz) {
        el.style.width = `${sz.w}px`;
        el.style.height = `${sz.h}px`;
        el.style.maxWidth = 'none';
        el.style.maxHeight = 'none';
        // Compensate the -50% centering translate so the top-left corner
        // stays fixed and only the bottom-right edge moves while resizing.
        const p = winPosRef.current;
        el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`;
      }
    }
  };

  const onWindowPointerDown = (e: React.PointerEvent<HTMLDivElement>, mode: 'move' | 'resize') => {
    if (e.button !== 0) return;
    const el = dialogRef.current;
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: winPosRef.current.x,
      origY: winPosRef.current.y,
      origW: winSizeRef.current?.w ?? el?.offsetWidth ?? 1200,
      origH: winSizeRef.current?.h ?? el?.offsetHeight ?? 600,
      rafId: null,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'nwse-resize';
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onWindowPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStateRef.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (s.mode === 'move') {
      winPosRef.current = { x: s.origX + dx, y: s.origY + dy };
    } else {
      const w = Math.max(700, s.origW + dx);
      const h = Math.max(500, s.origH + dy);
      winSizeRef.current = { w, h };
      // Keep the top-left corner anchored while growing from bottom-right.
      winPosRef.current = {
        x: s.origX + (w - s.origW) / 2,
        y: s.origY + (h - s.origH) / 2,
      };
    }
    if (s.rafId == null) {
      s.rafId = requestAnimationFrame(applyWindowDrag);
    }
  };

  const onWindowPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStateRef.current;
    if (s?.rafId != null) {
      cancelAnimationFrame(s.rafId);
      s.rafId = null;
    }
    dragStateRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    const view: TaskModalView = { ...winPosRef.current };
    const sz = winSizeRef.current;
    if (sz) { view.w = sz.w; view.h = sz.h; }
    saveTaskModalView(view);
    try { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
  };

  const applySavedView = (el: HTMLDivElement) => {
    const saved = loadTaskModalView();
    if (!saved) return;
    winPosRef.current = { x: saved.x, y: saved.y };
    el.style.transform = `translate(calc(-50% + ${saved.x}px), calc(-50% + ${saved.y}px))`;
    if (saved.w && saved.h) {
      winSizeRef.current = { w: saved.w, h: saved.h };
      el.style.width = `${saved.w}px`;
      el.style.height = `${saved.h}px`;
      el.style.maxWidth = 'none';
      el.style.maxHeight = 'none';
    }
  };

  const persistCurrentView = () => {
    const view: TaskModalView = { ...winPosRef.current };
    const size = winSizeRef.current;
    if (size) {
      view.w = size.w;
      view.h = size.h;
    }
    saveTaskModalView(view);
  };

  React.useLayoutEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    applySavedView(dialogRef.current);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    return persistCurrentView;
  }, [isOpen]);

  const handleResetView = () => {
    clearTaskModalView();
    winPosRef.current = { x: 0, y: 0 };
    winSizeRef.current = null;
    const el = dialogRef.current;
    if (el) {
      el.style.transform = '';
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
    }
  };

  const renderUploadingFile = (file: any) => (
    <div key={file.id} className={`relative group w-fit max-w-full mb-6 mt-1 opacity-70 ${file.status === 'uploading' ? 'animate-pulse' : ''}`}>
      <div className={`flex items-center gap-1.5 p-1.5 pb-3 pr-1.5 rounded-[12px] w-full min-w-[140px] shadow-sm relative z-10 overflow-visible ${file.status === 'error' ? 'bg-[#ffcfcf]' : 'bg-[#5a5a5a]'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.status === 'error' ? 'bg-[#ff9999]' : 'bg-[#666666]'}`}>
          {file.status === 'uploading' ? (
            <LoaderCircle className="w-4 h-4 text-white animate-spin" />
          ) : file.status === 'success' ? (
            <CheckCircle className="w-4 h-4 text-[#4ade80]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0 mr-1 pl-0.5 gap-0.5 pt-3">
          <button
            onClick={(event) => {
              event.stopPropagation();
              removeUpload(file.id);
            }}
            className="absolute top-1 left-1 p-0.5 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors z-20"
            title={file.status === 'error' ? 'Dismiss' : 'Cancel Upload'}
          >
            <X className="w-3 h-3" />
          </button>
          {file.status === 'error' && file.file && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleRetryUpload(file);
              }}
              className="absolute top-1 left-5 ml-1 p-0.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors z-20"
              title="Retry Upload"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          {file.tag === 'draft' ? (
            <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Draft</div>
          ) : file.tag === 'for_print' ? (
            <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">For Print</div>
          ) : file.tag === 'awb' ? (
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">AWB</div>
          ) : (
            <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-wide z-10 uppercase">Attachment</div>
          )}
          <div className="flex justify-between items-center w-full min-w-0 mt-1">
            <span className={`truncate font-medium text-[10px] tracking-wide pr-1 ${file.status === 'error' ? 'text-red-900' : 'text-white'}`}>
              {file.name}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 left-[5%] right-[5%] z-0">
        <div className={`w-full text-[10px] font-medium p-1 px-3 rounded-b-[12px] shadow-sm text-center ${file.status === 'error' ? 'bg-red-500 text-white' : 'bg-[#fae863] text-black'}`}>
          {file.status === 'uploading' ? `Uploading... ${file.progress}%` : file.status === 'success' ? 'Uploaded!' : 'Failed'}
        </div>
      </div>
    </div>
  );

  const renderFileCard = (file: any, includeFolders = false) => (
    <FileAttachmentCard
      key={file.url}
      allFiles={taskFiles}
      task={fullTask}
      file={file}
      deleteFile={deleteFile}
      isDeletingFile={isDeletingFile}
      onPreview={setPreviewFile}
      onDeleteLocal={(fileId: string) => setDeletedFileIds(prev => [...prev, fileId])}
      folders={includeFolders ? taskFolders : undefined}
      moveFile={includeFolders ? handleMoveFile : undefined}
    />
  );

  const renderFileSection = ({
    id,
    title,
    files,
    pendingUploads,
    icon,
  }: {
    id: 'artworks' | 'attachments';
    title: string;
    files: any[];
    pendingUploads: any[];
    icon: React.ReactNode;
  }) => {
    if (files.length === 0 && pendingUploads.length === 0) return null;

    const folderGroups: Record<string, any[]> = {};
    taskFolders.forEach((folder: any) => { folderGroups[folder._id] = []; });
    const ungroupedFiles: any[] = [];
    files.forEach((file: any) => {
      if (file.folderId && folderGroups[file.folderId]) folderGroups[file.folderId].push(file);
      else ungroupedFiles.push(file);
    });

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon} {title}
            {files.length > 0 && <span className="text-xs text-muted-foreground font-normal">({files.length})</span>}
          </label>
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => handleDownloadFiles(files, title)}
              className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors cursor-pointer"
              title={`Download all ${title.toLowerCase()}`}
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              Download All
            </button>
          )}
        </div>

        {pendingUploads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            {pendingUploads.map(renderUploadingFile)}
          </div>
        )}

        {taskFolders.length > 0 ? (
          <div className="space-y-3">
            {taskFolders.map((folder: any) => {
              const folderFiles = folderGroups[folder._id] || [];
              const expandedKey = `${id}:${folder._id}`;
              const isOpen = !!expandedFolderIds[expandedKey];
              const isDropTarget = dropFolderId === folder._id;
              return (
                <div
                  key={folder._id}
                  data-folder-id={folder._id}
                  className={`relative border border-border/60 rounded-xl overflow-hidden bg-muted/5 transition-colors ${isDropTarget ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragOverModal(false);
                    setDropFolderId(null);
                    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                      setPendingDropFolderId(folder._id);
                      setPendingDropFiles(Array.from(event.dataTransfer.files));
                    }
                  }}
                >
                  {isDropTarget && (
                    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-primary/10">
                      <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Drop to upload into this folder
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={() => toggleFolder(expandedKey)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
                    {isOpen ? (
                      <FolderOpen className="w-5 h-5 text-primary/70 shrink-0" fill="currentColor" />
                    ) : (
                      <Folder className="w-5 h-5 text-primary/70 shrink-0" fill="currentColor" />
                    )}
                    <span className="text-sm font-semibold flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{folderFiles.length} file(s)</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/60 p-3">
                      {folderFiles.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No {title.toLowerCase()} in this folder yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                          {folderFiles.map((file: any) => renderFileCard(file, true))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {ungroupedFiles.length > 0 && (
              <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/5">
                <button type="button" onClick={() => setUngroupedOpen(prev => ({ ...prev, [id]: !prev[id] }))} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
                  <Files className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-semibold flex-1 truncate">Ungrouped</span>
                  <span className="text-xs text-muted-foreground shrink-0">{ungroupedFiles.length} file(s)</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${ungroupedOpen[id] ? '' : '-rotate-90'}`} />
                </button>
                {ungroupedOpen[id] && (
                  <div className="border-t border-border/60 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                      {ungroupedFiles.map((file: any) => renderFileCard(file, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            {files.slice(0, 12).map((file: any) => renderFileCard(file))}
          </div>
        )}

        {files.length > 12 && taskFolders.length === 0 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              className="w-full shadow-sm hover:shadow-md transition-shadow"
              onClick={() => {
                onClose();
                router.push(`/admin/artworks?folder=${encodeURIComponent(task.title)}`);
              }}
            >
              View all {files.length} {title.toLowerCase()} in Artworks Manager
            </Button>
          </div>
        )}
      </section>
    );
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={dialogRef}
        className="task-modal-content top-1/2 left-1/2 max-w-[1200px] w-[95vw] md:w-[95vw] p-0 overflow-hidden bg-background border-border shadow-xl max-h-[85vh] flex flex-col will-change-transform"
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOverModal(false);
          setDropFolderId(null);
          setPendingDropFolderId(null);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setPendingDropFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        {isDragOverModal && !dropFolderId && (
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
            <div className="p-4 md:p-6 border-b border-border/50 shrink-0 cursor-move select-none touch-none"
              onPointerDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('input, textarea, button, select, a, [role="button"]')) return;
                onWindowPointerDown(e, 'move');
              }}
              onPointerMove={onWindowPointerMove}
              onPointerUp={onWindowPointerUp}
              onPointerCancel={onWindowPointerUp}>
              <div className="flex items-center gap-2 text-muted-foreground/60 mb-1">
                <div className="flex items-center gap-2 pointer-events-none">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-wide">Drag to move</span>
                </div>
                <button
                  type="button"
                  title="Reset view"
                  onClick={handleResetView}
                  className="ml-auto pointer-events-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
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
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span> Description
                  {typingInfo && String(typingInfo.userId) !== String(myUserId) && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/80">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      {typingInfo.userName} is typing…
                    </span>
                  )}
                </div>
                <div
                  ref={(el) => {
                    descriptionRef.current = el;
                    if (el && !el.dataset.descriptionInit) {
                      el.dataset.descriptionInit = '1';
                      el.innerHTML = description;
                    }
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  className={`min-h-[120px] rounded-md border shadow-sm p-3 text-sm text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-pre-wrap [&_b]:font-black [&_b]:text-[16px] [&_strong]:font-black [&_strong]:text-[16px] ${typingInfo && String(typingInfo.userId) !== String(myUserId) ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border/50 bg-muted/30"}`}
                  onFocus={() => {
                    editingFieldRef.current = 'description';
                    descriptionFocusActiveRef.current = true;
                    descriptionOnFocusRef.current = descriptionRef.current?.innerHTML || description;
                  }}
                  onInput={(e) => {
                    handleDescriptionInput((e.currentTarget as HTMLDivElement).innerHTML);
                  }}
                  onPaste={handleDescriptionPaste}
                  onBlur={(e) => {
                    editingFieldRef.current = null;
                    descriptionFocusActiveRef.current = false;
                    stopTypingKeepAlive();
                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                    lastTypingEmitRef.current = 0;
                    emitTyping(descriptionRef.current?.innerHTML || "", true);
                    const html = (e.currentTarget as HTMLDivElement).innerHTML;
                    if (html !== descriptionOnFocusRef.current) handleSaveDetails({ description: html });
                    else {
                      const fb = fullTask.description || "";
                      setDescription(fb);
                      e.currentTarget.innerHTML = fb;
                    }
                  }}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="mb-6 space-y-5">
                  <div className="flex items-center justify-end flex-wrap gap-2">
                    {fullTask.status === "IN_PRODUCTION" ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/admin/production?folder=${encodeURIComponent(task.title || task._id)}`} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors shadow-sm" title="Go to Production Folder">
                          <Folder className="w-3.5 h-3.5" />
                          Production Folder
                        </a>
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
                    <div className="space-y-6">
                      {renderFileSection({
                        id: 'artworks',
                        title: 'Artworks',
                        files: artworkFiles,
                        pendingUploads: artworkUploads,
                        icon: <Printer className="w-4 h-4 text-muted-foreground" />,
                      })}
                      {renderFileSection({
                        id: 'attachments',
                        title: 'Attachments',
                        files: attachmentFiles,
                        pendingUploads: attachmentUploads,
                        icon: <Paperclip className="w-4 h-4 text-muted-foreground" />,
                      })}
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
                    <DropdownMenuItem onClick={() => {
                      uploadTagRef.current = 'awb';
                      setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                    }}>
                      <Badge className="bg-red-500 mr-2 text-[10px]">AWB</Badge> Upload AWB
                    </DropdownMenuItem>
                    {taskFolders.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Upload to folder
                        </div>
                        <DropdownMenuItem onClick={() => {
                          uploadFolderIdRef.current = null;
                          uploadTagRef.current = 'attachment';
                          setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                        }}>
                          <Folder className="w-4 h-4 mr-2 text-muted-foreground" /> No folder (general)
                        </DropdownMenuItem>
                        {taskFolders.map(folder => (
                          <DropdownMenuItem key={folder._id} onClick={() => {
                            uploadFolderIdRef.current = folder._id;
                            uploadTagRef.current = 'attachment';
                            setTimeout(() => document.getElementById('task-file-upload')?.click(), 50);
                          }}>
                            <Folder className="w-4 h-4 mr-2 text-primary/70" /> {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
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
                    {TASK_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "UNASSIGNED"
                          ? "Unassigned"
                          : category.toLowerCase().split(" ").map(w => w.split("/").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("/")).join(" ")}
                      </SelectItem>
                    ))}
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
                        'IN_PRODUCTION', 'PRINT_AWB', 'DONE_PRINTING', 'PACKAGING',
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
                <div className="flex flex-wrap items-center gap-2">
                  {orderId && (
                    <a href={`/admin/orders?search=${orderId}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md font-medium">
                      View Order
                    </a>
                  )}
                  {orderId && ((orders.find((o: any) => o._id === orderId) as any)?.awbUrl ? (
                    <>
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
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => alert("EasyParcel integration: AWB will be automatically assigned here.")}
                    >
                      Assign AWB
                    </Button>
                  ))}
                  {customerUsername && (
                    <a href={`/admin/artworks?search=${customerUsername}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1.5 rounded-md font-medium">
                      View Artworks
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {awbFile && (
              <div className="pt-4 space-y-2 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-red-500" /> AWB Preview
                </h3>
                {awbIsImage ? (
                  <a
                    href={awbPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-border bg-muted/30 hover:ring-2 hover:ring-red-400/50 transition-all"
                  >
                    <img src={awbPreviewUrl} alt={awbFile.name || 'AWB'} className="w-full h-auto max-h-48 object-contain bg-white" />
                    <div className="bg-black/70 text-white text-[10px] px-2 py-1 truncate">{awbFile.name}</div>
                  </a>
                ) : awbIsPdf ? (
                  <div className="rounded-xl overflow-hidden border border-border bg-white">
                    <iframe src={awbProxyUrl} className="w-full h-48 border-none" title={awbFile.name || 'AWB'} />
                    <div className="bg-black/70 text-white text-[10px] px-2 py-1 truncate">{awbFile.name}</div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-red-300 bg-red-50/50 p-4 text-center">
                    <File className="w-6 h-6 text-red-400 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">AWB file uploaded (cannot be previewed)</p>
                    <Button variant="outline" size="sm" className="text-xs h-8 mt-2 text-red-500 border-red-300 hover:bg-red-100" onClick={() => { setPreviewFile(awbFile); }}>
                      View AWB File
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-6 mt-auto border-t border-border/50">
              <Button onClick={onClose} className="w-full font-bold">Done</Button>
            </div>
            
          </div>
        </div>
        {pendingDropFiles && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setPendingDropFiles(null); setPendingDropFolderId(null); }}>
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-1">Upload {pendingDropFiles.length} file{pendingDropFiles.length > 1 ? 's' : ''}</h3>
              <p className="text-sm text-muted-foreground mb-3">What type of file is this?</p>
              {taskFolders.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Upload to folder</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${pendingDropFolderId === null ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}
                      onClick={() => setPendingDropFolderId(null)}
                    >
                      <Folder className="w-3.5 h-3.5" /> General
                    </button>
                    {taskFolders.map(folder => (
                      <button
                        key={folder._id}
                        type="button"
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${pendingDropFolderId === folder._id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50'}`}
                        onClick={() => setPendingDropFolderId(folder._id)}
                      >
                        <Folder className="w-3.5 h-3.5" /> {folder.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-3 text-center transition hover:border-red-500/60 hover:bg-red-500/10"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'awb', pendingDropFolderId); setPendingDropFiles(null); setPendingDropFolderId(null); }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">AWB</span>
                </button>
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-slate-500/25 bg-slate-500/5 p-3 text-center transition hover:border-slate-500/60 hover:bg-slate-500/10"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'attachment', pendingDropFolderId); setPendingDropFiles(null); setPendingDropFolderId(null); }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500 text-white">
                    <Paperclip className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Attachment</span>
                </button>
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-3 text-center transition hover:border-orange-500/60 hover:bg-orange-500/10"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'draft', pendingDropFolderId); setPendingDropFiles(null); setPendingDropFolderId(null); }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <File className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Draft</span>
                </button>
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-green-500/25 bg-green-500/5 p-3 text-center transition hover:border-green-500/60 hover:bg-green-500/10"
                  onClick={() => { uploadDroppedFiles(pendingDropFiles, 'for_print', pendingDropFolderId); setPendingDropFiles(null); setPendingDropFolderId(null); }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                    <Printer className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">For Print</span>
                </button>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => { setPendingDropFiles(null); setPendingDropFolderId(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onWindowPointerDown(e, 'resize'); }}
          onPointerMove={onWindowPointerMove}
          onPointerUp={onWindowPointerUp}
          onPointerCancel={onWindowPointerUp}
          className="absolute bottom-1 right-1 z-[60] h-5 w-5 cursor-nwse-resize text-muted-foreground/50 hover:text-primary flex items-center justify-center touch-none"
          title="Resize"
        >
          <MoveDiagonal className="h-4 w-4" />
        </div>
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
