/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useMemo } from "react";
import { useFolderGroup, useFilesByFolder, useReviewFile, useDeleteFile, useBulkDeleteFiles, useRenameFile, useCreateShareLink, useFolders, useCreateFolder, useRenameFolder, useDeleteFolder, useMoveFile } from "@/hooks/useAdminDashboard";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrder";
import { useUsers } from "@/hooks/useUsers";
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Paperclip, Image as ImageIcon, Download, Eye, CircleCheck, Trash2, Search, X, MessageSquare, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, Printer, Share2, Upload, Pencil, User, Tag, Calendar, CheckSquare, Truck } from "lucide-react";
import { forceDownload } from "@/lib/utils";
import { FilePreviewModal } from "@/components/global/FilePreviewModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUploadStore } from "@/store/uploadStore";
import ImageNext from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AxiosInstance from "@/utils/axios";
import { uploadFilesToS3Directly, uploadToS3Directly } from "@/utils/s3Upload";
import LoadingAnimation from "@/components/global/LoadingAnimation";
import { useLowPowerAnimations } from "@/hooks/useLowPowerAnimations";
import { buildFileShareUrl, isPdfFile, preparePdfSharePreview } from "@/lib/fileSharePreview";
import { Virtuoso } from "react-virtuoso";

const categories = [
  "ALL",
  "DIGITAL PRINTING",
  "DISPLAY ITEM",
  "DIGITAL OFFSET",
  "PREMIUM GIFT",
  "APPAREL",
  "FRAME",
  "WEDDING PRODUCT",
  "FOOD PACKAGING"
];

// Artwork Manager only owns the pre-production stages. Once a job hits
// IN_PRODUCTION/PRINT_AWB/DONE_PRINTING it belongs to the Production
// page; PACKAGING belongs to the Packaging page; everything after that
// (shipped/delivered/cancelled/failed) belongs to History.
const ARTWORK_VISIBLE_STATUSES = ["PLACED", "IN_DESIGN", "IN_PROGRESS", "PENDING_ARTWORK", "ARTWORK_REVIEWED", "ARTWORK_REJECTED", "PEMBETULAN", "DONE_DESIGN"];
const ARTWORK_STATUSES = ARTWORK_VISIBLE_STATUSES;
const ALL_STATUSES = ["PLACED", "IN_PROGRESS", "PENDING_ARTWORK", "ARTWORK_REVIEWED", "ARTWORK_REJECTED", "IN_DESIGN", "PEMBETULAN", "DONE_DESIGN", "IN_PRODUCTION", "PRINT_AWB", "DONE_PRINTING", "PACKAGING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED", "RETURN"];

const getFolderItemKey = (index: number, group: any) =>
  group.taskId
    ? `task:${group.taskId}`
    : group.orderId
      ? `order:${group.orderId}`
      : group.userId
        ? `user:${group.userId}`
        : `folder:${group.folderName || "unnamed"}:${index}`;

export default function ArtworksManager() {
  const lowPower = useLowPowerAnimations();
  const { addUpload, updateProgress, updateStatus } = useUploadStore();
  const { data: session } = useSession();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  // Folder list from server-side grouped endpoint — fast, single query
  const { data: folderGroupResponse, isPending: folderGroupPending, refetch, isFetching } = useFolderGroup(ARTWORK_STATUSES);
  const groupedFromServer: any[] = (folderGroupResponse as any)?.data || [];
  const selectedGroup = useMemo(() => groupedFromServer.find(
    group => `${group.folderName}-${group.orderId}-${group.taskId}` === selectedFolder
  ), [groupedFromServer, selectedFolder]);
  const { data: orderDetailResponse } = useOrder(!selectedGroup?.taskId ? selectedGroup?.orderId : undefined);
  const { data: taskDetailResponse } = useTask(selectedGroup?.taskId);
  const { data: usersResponse } = useUsers(!!selectedFolder);
  const { mutateAsync: createShareLink, isPending: isGeneratingLink } = useCreateShareLink();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [commentText, setCommentText] = useState("");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "", taskId: "", folderId: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Subfolder State
  const [activeSubFolderId, setActiveSubFolderId] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderTarget, setRenameFolderTarget] = useState<{ id: string; name: string; type: "task" | "subfolder" } | null>(null);
  const [renamedFolderName, setRenamedFolderName] = useState("");
  const [moveToFolderModalOpen, setMoveToFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [shareTarget, setShareTarget] = useState<{
    folderName: string;
    taskId?: string;
    orderId?: string;
    userId?: string;
  } | null>(null);

  const { data: virtualFoldersResponse } = useFolders(!!selectedFolder);
  const virtualFolders = (virtualFoldersResponse as any)?.data || [];
  const { mutate: createFolderMutate, isPending: isCreatingFolder } = useCreateFolder();
  const { mutate: renameFolderMutate, isPending: isRenamingFolder } = useRenameFolder();
  const { mutate: deleteFolderMutate, isPending: isDeletingFolder } = useDeleteFolder();
  const { mutate: moveFileMutate, mutateAsync: moveFileMutateAsync, isPending: isMovingFile } = useMoveFile();

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteFiles();
  const { mutate: renameFileMutate } = useRenameFile();
  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask();
  const { mutate: updateOrderStatus, isPending: isBulkMovingStatus } = useUpdateOrderStatus();

  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [draggedArtworkFileIds, setDraggedArtworkFileIds] = useState<string[]>([]);
  const [dragOverSubFolderId, setDragOverSubFolderId] = useState<string | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState<boolean>(false);
  const [pendingArtworkDrop, setPendingArtworkDrop] = useState<File[] | null>(null);

  // Sysadmin bulk folder status move
  const [bulkSelectMode, setBulkSelectMode] = useState<boolean>(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>("IN_PRODUCTION");

  // Folder list decluttering — empty folders are shown by default (a task
  // needs its folder visible from the moment it's created so staff can
  // upload the very first file into it). The toggle is still here for
  // staff who want to temporarily hide clutter once a queue gets long.
  const [showEmptyFolders, setShowEmptyFolders] = useState<boolean>(true);
  const [folderScope, setFolderScope] = useState<"all" | "tasks">("all");

  // Server-side grouping already handles status filtering and ordering.
  // Client just filters by category tab and search query.
  const visibleGroupedFiles = useMemo(() => {
    let result = groupedFromServer;

    if (activeTab !== "ALL") {
      result = result.filter((g: any) => {
        const firstFile = g.files?.[0];
        return g.category === activeTab || firstFile?.category === activeTab;
      });
    }

    if (!showEmptyFolders) {
      result = result.filter((g: any) => g.files?.length > 0);
    }
    if (folderScope === "tasks") {
      result = result.filter((g: any) => g.taskId);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((g: any) => {
        const nameMatch = g.folderName?.toLowerCase().includes(q);
        const fileMatch = g.files?.some((f: any) =>
          f.originalName?.toLowerCase().includes(q) ||
          f.userId?.toString().toLowerCase().includes(q)
        );
        return nameMatch || fileMatch;
      });
    }

    return result;
  }, [groupedFromServer, activeTab, showEmptyFolders, folderScope, searchQuery]);

  // Once a folder is opened, fetch its full file details (thumbnails, S3
  // URLs, etc.) on demand — the folder LIST above only ever needed names
  // and counts, which the slim index already provides.
  const activeFolderIdentity = useMemo(() => {
    if (!selectedFolder) return null;
    const g = groupedFromServer.find(g => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
    if (!g) return null;
    return g.taskId
      ? { taskId: g.taskId }
      : { orderId: g.orderId || null, userId: g.userId || null };
  }, [selectedFolder, groupedFromServer]);

  const { data: folderFilesResponse, isPending: isFolderFilesPending } = useFilesByFolder(activeFolderIdentity);
  const activeFolderFiles: any[] = (folderFilesResponse as any)?.data || [];

  React.useEffect(() => {
    const folderQuery = searchParams.get("folder");
    if (folderQuery && groupedFromServer.length > 0 && !selectedFolder) {
      const match = groupedFromServer.find(g => g.folderName === folderQuery);
      if (match) {
        setSelectedFolder(`${match.folderName}-${match.orderId}-${match.taskId}`);
      }
    }
  }, [searchParams, groupedFromServer, selectedFolder]);

  React.useEffect(() => {
    setSelectedFiles([]);
    setActiveSubFolderId(null);
  }, [selectedFolder]);

  const handleSelectAll = (files: any[]) => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f._id));
    }
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleArtworkDragStart = (event: React.DragEvent, fileId: string) => {
    const fileIds = selectedFiles.includes(fileId) ? selectedFiles : [fileId];
    setDraggedArtworkFileIds(fileIds);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", fileIds.join(","));
  };

  const handleArtworkDrop = async (event: React.DragEvent, folderId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const transferredIds = event.dataTransfer.getData("text/plain").split(",").filter(Boolean);
    const fileIds = draggedArtworkFileIds.length > 0 ? draggedArtworkFileIds : transferredIds;
    if (fileIds.length === 0) return;

    try {
      await Promise.all(fileIds.map(fileId => moveFileMutateAsync({ fileId, folderId })));
      toast.success(`${fileIds.length} file${fileIds.length === 1 ? "" : "s"} moved to subfolder`);
      setSelectedFiles([]);
    } catch {
      toast.error("Failed to move file to subfolder");
    } finally {
      setDraggedArtworkFileIds([]);
      setDragOverSubFolderId(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) {
      bulkDeleteMutate(selectedFiles, {
        onSuccess: () => {
          toast.success("Files deleted successfully");
          setSelectedFiles([]);
        }
      });
    }
  };

  const handleReview = (fileId: string, currentStatus: boolean, notes?: string) => {
    reviewFileMutate(
      { id: fileId, reviewed: !currentStatus, notes },
      {
        onSuccess: () => {
          toast.success("File status updated!");
        },
      }
    );
  };

  const handleSaveComment = () => {
    if (!selectedFile) return;
    reviewFileMutate(
      { id: selectedFile._id, reviewed: selectedFile.adminReviewed, notes: commentText },
      {
        onSuccess: () => {
          toast.success("Comment saved!");
          setCommentModalOpen(false);
        },
      }
    );
  };

  const handleDelete = (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;
    deleteFileMutate(fileId, {
      onSuccess: () => {
        toast.success("File deleted successfully!");
      },
    });
  };

  // Uploads files dropped onto a folder, tagged as the user's choice
  // (draft / attachment / for_print) from the picker shown after drop.
  const uploadArtworkDroppedFiles = (files: File[], tag: string) => {
    const activeGroup = groupedFromServer.find((g: any) => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
    if (!activeGroup) return;

    const token = (session as any)?.user?.token || localStorage.getItem('token') || "";

    const uploadItems = files.map((file) => ({
      file,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      abortController: new AbortController(),
    }));

    uploadItems.forEach(({ file, id, abortController }) => {
      addUpload({
        id,
        name: file.name,
        tag: "Artwork",
        taskId: activeGroup.taskId,
        file,
        abortController
      });
    });

    const uploadBatch = async () => {
      const uploaded = new Array<{ id: string; data: Awaited<ReturnType<typeof uploadToS3Directly>> } | undefined>(uploadItems.length);
      const errors: Error[] = [];
      let cursor = 0;

      async function worker() {
        while (cursor < uploadItems.length) {
          const index = cursor++;
          const { file, id, abortController } = uploadItems[index];

          try {
            updateStatus(id, 'uploading');
            const folderPath = activeGroup.userId || activeGroup.taskId || 'general';
            const data = await uploadToS3Directly(token, file, folderPath, (percent) => updateProgress(id, percent), abortController);
            uploaded[index] = { id, data };
          } catch (err: any) {
            const error = err instanceof Error ? err : new Error('Upload failed');
            errors.push(error);
            updateStatus(id, 'error', error.message);
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(3, uploadItems.length) }, () => worker())
      );

      const successful = uploaded.filter((item): item is NonNullable<typeof item> => Boolean(item));
      if (successful.length === 0) throw errors[0] || new Error('Upload failed');

      try {
        const shareSlug = activeGroup.files.find((file: any) => file.shareSlug)?.shareSlug;
        await AxiosInstance(token).post("/api/files/save-metadata", {
          userId: activeGroup.userId || undefined,
          orderId: activeGroup.orderId || undefined,
          taskId: activeGroup.taskId || undefined,
          folderId: activeSubFolderId || undefined,
          shareSlug: shareSlug || undefined,
          category: activeGroup.taskId ? 'TASK' : (activeTab !== "ALL" ? activeTab : "DIGITAL PRINTING"),
          tag,
          files: successful.map(({ data }) => data),
        });
        successful.forEach(({ id }) => updateStatus(id, 'success'));
        await refetch();
      } catch (err: any) {
        successful.forEach(({ id }) => updateStatus(id, 'error', err.message || 'Failed to save metadata'));
        throw err;
      }

      if (errors.length > 0) {
        throw new Error(`${errors.length} file(s) failed; successful files were saved.`);
      }
    };

    toast.promise(uploadBatch(), {
      loading: `Uploading ${files.length} files...`,
      success: 'Files uploaded successfully',
      error: (error: any) => error.message || 'Failed to upload files'
    });
  };

  const handleDownloadAll = async (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading("Preparing ZIP...");
    const downloadId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    // Poll for real-time file-count progress while the actual ZIP streams
    // in the separate fetch below.
    const pollInterval = setInterval(async () => {
      try {
        const progRes = await fetch(`${backendUrl}/api/files/download-progress/${downloadId}`);
        if (!progRes.ok) return;
        const prog = await progRes.json();
        if (prog?.total > 0) {
          toast.loading(`Downloading files... (${prog.current}/${prog.total})`, { id: toastId });
        }
      } catch {
        // ignore transient polling errors
      }
    }, 500);

    try {
      // Stream the ZIP from the backend instead of building it client-side
      // with JSZip — pulling every file's full bytes into browser memory
      // before assembling the archive is what caused "array buffer
      // allocation failed" on folders with many or large files.
      const token = session?.user?.token || localStorage.getItem('token') || "";
      const fileIds = group.files.map((f: any) => f._id);

      const response = await fetch(`${backendUrl}/api/files/download-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileIds, zipName: group.folderName || "artworks", downloadId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Could not download any files");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${group.folderName || "artworks"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const skippedHeader = response.headers.get("X-Skipped-Files");
      toast.dismiss(toastId);
      if (skippedHeader && Number(skippedHeader) > 0) {
        toast.warning(`Downloaded with ${skippedHeader} file(s) skipped (failed to fetch)`);
      } else {
        toast.success("Download started!");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to create ZIP");
    } finally {
      clearInterval(pollInterval);
    }
  };

  // Sysadmin: move every selected folder (task or order) to a new status in one click
  const handleBulkStatusMove = () => {
    if (selectedFolderIds.length === 0) return;
    if (!confirm(`Move ${selectedFolderIds.length} folder(s) to "${bulkTargetStatus.replace(/_/g, ' ')}"?`)) return;

    const targets = groupedFromServer.filter((g: any) => selectedFolderIds.includes(`${g.folderName}-${g.orderId}-${g.taskId}`));
    let done = 0;
    const total = targets.length;
    const finish = () => {
      done += 1;
      if (done === total) {
        toast.success(`Moved ${total} folder(s) to ${bulkTargetStatus.replace(/_/g, ' ')}`);
        setSelectedFolderIds([]);
        setBulkSelectMode(false);
      }
    };

    targets.forEach((group: any) => {
      if (group.taskId) {
        updateTask({ id: group.taskId, data: { status: bulkTargetStatus }, skipUndo: true, silent: true }, { onSuccess: finish, onError: finish });
      } else if (group.orderId) {
        updateOrderStatus({ id: group.orderId, status: bulkTargetStatus, skipUndo: true, silent: true }, { onSuccess: finish, onError: finish });
      } else {
        finish();
      }
    });
  };

  const handleDeleteFolder = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ALL ${group.files.length} files in ${group.folderName}? This cannot be undone.`)) return;
    
    const fileIds = group.files.map((f: any) => f._id);
    bulkDeleteMutate(fileIds, {
      onSuccess: () => {
        toast.success(`Deleted ${group.files.length} files successfully!`);
      },
      onError: (err: any) => {
        toast.error(`Failed to delete files: ${err.message || 'Unknown error'}`);
      }
    });
  };

  const handleUploadSubmit = async () => {
    if (isUploading) return;
    if (!uploadFiles || uploadFiles.length === 0) return toast.error("Please select a file");

    setIsUploading(true);
    try {
      const token = session?.user?.token || localStorage.getItem('token') || ""; 

      const { uploaded, failed } = await uploadFilesToS3Directly(token, uploadFiles);
      if (uploaded.length === 0) throw failed[0]?.error || new Error("Upload failed");

      await AxiosInstance(token).post("/api/files/save-metadata", {
        userId: uploadData.userId || undefined,
        orderId: uploadData.orderId || undefined,
        taskId: uploadData.taskId || undefined,
        folderId: uploadData.folderId || undefined,
        category: uploadData.taskId ? 'TASK' : uploadData.category,
        notes: uploadData.notes,
        files: uploaded,
      });

      await refetch();

      if (failed.length > 0) {
        const remaining = new DataTransfer();
        failed.forEach(({ file }) => remaining.items.add(file));
        setUploadFiles(remaining.files);
        toast.error(`${failed.length} file(s) failed. Successful files were saved; retry the remaining files.`);
        return;
      }

      toast.success("Artwork uploaded successfully");
      setUploadFiles(null);
      setUploadModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to upload artwork");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (mimetype?.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}/${path}`;
  };

  const getThumbnailUrl = (path: string) => {
    const rawUrl = getFileUrl(path);
    // Free global CDN proxy to automatically downscale 50MB S3 images to 200px thumbnails
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=200&h=200&fit=cover`;
  };

  const prepareSharePreview = (file: any) => {
    if (!file?._id || !isPdfFile(file)) return;
    void preparePdfSharePreview(file._id).catch(() => {});
  };

  const handleCopyLink = async (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isPdf = isPdfFile(file);

    try {
      await navigator.clipboard.writeText(buildFileShareUrl(window.location.origin, file._id, isPdf));
      toast.success(isPdf ? "Share link copied; PDF preview is warming in the background" : "Share link copied");
      if (isPdf) void preparePdfSharePreview(file._id).catch(() => {});
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const handleAudienceShare = async (audience: "CUSTOMER" | "SUPPLIER") => {
    if (!shareTarget) return;
    try {
      const res = await createShareLink({ ...shareTarget, audience });
      const slug = res?.data?.slug;
      if (!slug) throw new Error("Share link was not returned");
      await navigator.clipboard.writeText(`${window.location.origin}/share/${slug}`);
      setShareTarget(null);
      toast.success(`${audience === "CUSTOMER" ? "Customer" : "Supplier"} share link copied`);
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  const getFileThumbnail = (file: any, contextFiles: any[] = []) => {
    const isImage = file.mimetype?.includes("image") || (file.originalName && file.originalName.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i));
    const isPdf = file.mimetype?.includes("pdf") || (file.originalName && file.originalName.toLowerCase().endsWith(".pdf"));

    if (isImage) {
      return (
        <div className="w-full h-24 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center relative group/thumb">
          <img 
            src={getThumbnailUrl(file.path)} 
            alt={file.originalName || "thumbnail"} 
            className="object-cover w-full h-full absolute inset-0 z-0 transition-transform group-hover/thumb:scale-105" 
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextEl) nextEl.style.display = 'flex';
            }} 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); setPreviewList(contextFiles); }} className="gap-1 shadow-sm">
              <Eye className="w-4 h-4" /> View
            </Button>
          </div>
          <div style={{ display: 'none' }} className="w-full h-full items-center justify-center z-10 bg-muted/50">
            {getFileIcon(file.mimetype || "image/jpeg")}
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-24 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center relative group/thumb">
          <FileText className="w-10 h-10 text-red-500" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); setPreviewList(contextFiles); }} className="gap-1 shadow-sm">
              <Eye className="w-4 h-4" /> View
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-24 bg-muted/50 rounded-t-lg flex items-center justify-center relative group/thumb">
        {getFileIcon(file.mimetype)}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-20">
          <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); setPreviewList(contextFiles); }} className="gap-1 shadow-sm">
            <Eye className="w-4 h-4" /> View
          </Button>
        </div>
      </div>
    );
  };

  // Folder-card preview: show the first image inside the folder so users can see
  // at a glance what's in it, instead of always showing a generic folder icon.
  const getFolderPreview = (group: any, sizeClass: string = "w-16 h-16 rounded-2xl") => {
    return (
      <div className={`${sizeClass} bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0`}>
        <Folder className="w-8 h-8 text-primary" />
      </div>
    );
  };
if (!groupedFromServer.length && folderGroupPending) return <LoadingAnimation fullScreen={false} label="Loading artworks" />;

  return (
    <div className="space-y-6 bg-background/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by file name, order ID, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="shrink-0" title="Refresh Artworks">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted p-1 rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Large Thumbnail View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Dialog open={uploadModalOpen} onOpenChange={(open) => {
            if (isUploading) return;
            setUploadModalOpen(open);
            if (!open) {
              setUploadFiles(null);
              setUploadData({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "", taskId: "", folderId: "" });
            }
          }}>
            <Button onClick={() => {
              setUploadData({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "", taskId: "", folderId: "" });
              setUploadModalOpen(true);
            }}><Plus className="w-4 h-4 mr-2" /> Upload Artwork</Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Artwork for User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!(uploadData.userId || uploadData.taskId || uploadData.orderId) && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={uploadData.category} onChange={e => setUploadData({ ...uploadData, category: e.target.value })}>
                      {categories.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Files *</Label>
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center bg-muted/10 relative hover:bg-muted/20 transition-colors group">
                    <input 
                      type="file" 
                      multiple 
                      disabled={isUploading}
                      onChange={e => setUploadFiles(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="Click to select files"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <h3 className="text-base font-medium mb-1">Upload your artwork</h3>
                    <p className="text-xs text-muted-foreground mb-4">Drag and drop or click to browse files</p>
                    <Button variant="outline" size="sm" className="border-border/50 pointer-events-none relative z-0">
                      Select Files
                    </Button>
                  </div>

                  {uploadFiles && uploadFiles.length > 0 && (
                    <div className="bg-muted/10 rounded-lg p-3 border border-border/50 space-y-2 max-h-40 overflow-y-auto mt-2 custom-scrollbar">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">{uploadFiles.length} File(s) Selected</h4>
                      {Array.from(uploadFiles).map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-background p-2 rounded border border-border/50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.includes('image') ? (
                              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-xs font-medium truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const dt = new DataTransfer();
                              Array.from(uploadFiles).filter((_, index) => index !== i).forEach(f => dt.items.add(f));
                              setUploadFiles(dt.files.length > 0 ? dt.files : null);
                            }}
                            className="p-1 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground transition-colors z-20 relative"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea placeholder="Internal notes..." value={uploadData.notes} onChange={e => setUploadData({ ...uploadData, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="border-t border-white/5 pt-4 mt-2 px-6 pb-6">
                <Button variant="outline" disabled={isUploading} onClick={() => {
                  setUploadModalOpen(false);
                  setUploadFiles(null);
                  setUploadData({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "", taskId: "", folderId: "" });
                }}>Cancel</Button>
                <Button disabled={isUploading} onClick={handleUploadSubmit}>{isUploading ? "Uploading..." : "Upload"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start mb-6">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {groupedFromServer.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
          No artwork for now to view.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[600px]">

          {/* LEFT PANEL (MASTER) */}
          <div className="w-full lg:w-1/3 xl:w-1/4 border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden h-full min-h-0">
            <div className="p-4 border-b bg-muted/30 font-semibold text-sm flex justify-between items-center shrink-0 gap-2">
              <span>Folders</span>
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{visibleGroupedFiles.length}</span>
                <Button
                  variant={bulkSelectMode ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setBulkSelectMode(v => !v); setSelectedFolderIds([]); }}
                  title="Sysadmin: move multiple folders to a status in one click"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1" /> Bulk Move
                </Button>
              </div>
            </div>
            <div className="p-3 border-b bg-muted/10 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center bg-muted p-1 rounded-md text-xs">
                <button
                  onClick={() => setFolderScope("all")}
                  className={`px-2.5 py-1 rounded-sm transition-colors ${folderScope === "all" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  All Uploads
                </button>
                <button
                  onClick={() => setFolderScope("tasks")}
                  className={`px-2.5 py-1 rounded-sm transition-colors ${folderScope === "tasks" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Tasks Only
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <Checkbox checked={showEmptyFolders} onCheckedChange={() => setShowEmptyFolders(v => !v)} />
                Show empty
              </label>
            </div>
            {bulkSelectMode && (
              <div className="p-3 border-b bg-muted/20 flex flex-col gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{selectedFolderIds.length} folder(s) selected</span>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2"
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    disabled={selectedFolderIds.length === 0 || isBulkMovingStatus || isUpdatingTask}
                    onClick={handleBulkStatusMove}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              {visibleGroupedFiles.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No folders match this filter.
                </div>
              )}
              {visibleGroupedFiles.length > 0 && (
                <Virtuoso
                  className="h-full"
                  data={visibleGroupedFiles}
                  computeItemKey={getFolderItemKey}
                  increaseViewportBy={lowPower ? 0 : { top: 200, bottom: 400 }}
                  itemContent={(index, group) => {
                    const folderId = `${group.folderName}-${group.orderId}-${group.taskId}`;
                    const isSelected = selectedFolder === folderId;
                    const isBulkChecked = selectedFolderIds.includes(folderId);
                    return (
                      <div className={`px-3 pb-2 ${index === 0 ? "pt-3" : ""}`}>
                        <div
                     className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'}`}
                    onClick={() => bulkSelectMode
                      ? setSelectedFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId])
                      : setSelectedFolder(folderId)
                    }
                  >
                    {bulkSelectMode && (
                      <Checkbox
                        checked={isBulkChecked}
                        onCheckedChange={() => setSelectedFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId])}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {getFolderPreview(group, "w-10 h-10 rounded-lg")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" title={group.folderName}>{group.folderName}</p>
                      {group.orderId && <p className="text-[11px] font-bold text-foreground/70 truncate">Order: {group.orderId}</p>}
                      <p className="text-xs text-muted-foreground">{group.fileCount} file(s)</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                        onClick={(e) => { e.stopPropagation(); if (group.taskId) { setRenameFolderTarget({ id: group.taskId, name: group.folderName, type: "task" }); setRenamedFolderName(group.folderName); } }}
                        disabled={!group.taskId}
                        title={group.taskId ? "Rename Task Folder" : "This folder name is managed by its source"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => handleDeleteFolder(group, e)}
                        disabled={isBulkDeleting}
                        title="Delete Folder and All Files"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                          <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${isSelected ? 'text-primary translate-x-1' : 'text-muted-foreground'}`} />
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>

          {/* RIGHT PANEL (DETAIL) */}
          <div className="w-full lg:w-2/3 xl:w-3/4 border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden h-full">
          {selectedFolder ? (
          <div className="space-y-4 p-4 sm:p-6 flex-1 overflow-y-auto">
          {(() => {
            const activeGroup = groupedFromServer.find(g => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
            if (!activeGroup) {
              setTimeout(() => setSelectedFolder(null), 0);
              return null;
            }
            
            const groupFolders = virtualFolders.filter((f: any) => 
              activeGroup.taskId ? f.taskId === activeGroup.taskId : f.userId === activeGroup.userId
            );
            const visibleFiles = activeFolderFiles.filter((f: any) => 
              activeSubFolderId ? f.folderId === activeSubFolderId : (!f.folderId || f.folderId === 'null')
            );
            const currentFolder = activeSubFolderId ? groupFolders.find(f => f._id === activeSubFolderId) : null;
            const visibleFolders = activeSubFolderId ? [] : groupFolders;

            if (isFolderFilesPending) {
              return (
                <div className="flex justify-center items-center h-[40vh]">
                  <LoadingAnimation fullScreen={false} label="Loading folder" />
                </div>
              );
            }

            return (
              <div 
                className={`relative transition-colors rounded-xl ${isDragOverFolder ? 'bg-primary/5 border border-primary border-dashed p-4' : ''}`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (Array.from(e.dataTransfer.types).includes("Files")) setIsDragOverFolder(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (Array.from(e.dataTransfer.types).includes("Files")) setIsDragOverFolder(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverFolder(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setPendingArtworkDrop(Array.from(e.dataTransfer.files));
                  }
                }}
              >
                {isDragOverFolder && (
                  <div 
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl"
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverFolder(false); }}
                  >
                    <p className="text-lg font-bold text-primary flex items-center gap-2 pointer-events-none">
                      <Download className="w-6 h-6 animate-bounce" /> Drop files to upload to this folder
                    </p>
                  </div>
                )}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          <Folder className="w-5 h-5 text-primary" />
                          {activeGroup.folderName}
                        </h2>
                        {activeGroup.orderId && <p className="text-[14.4px] font-bold text-foreground/80">Order ID: {activeGroup.orderId}</p>}
                      </div>
                    </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {visibleFiles.length > 0 && (
                          <div className="flex items-center gap-3 mr-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="select-all" 
                                checked={selectedFiles.length === visibleFiles.length && visibleFiles.length > 0}
                                onCheckedChange={() => handleSelectAll(visibleFiles)}
                              />
                              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">
                                Select All ({selectedFiles.length})
                              </label>
                            </div>
                            {selectedFiles.length > 0 && (
                              <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                                <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
                              </Button>
                            )}
                            {selectedFiles.length > 0 && (
                              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setMoveToFolderModalOpen(true)}>
                                <Folder className="w-3 h-3 mr-1" /> Move ({selectedFiles.length})
                              </Button>
                            )}
                          </div>
                        )}
                          {visibleFiles.some((f: any) => f.tag === 'draft') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/50 text-primary hover:bg-primary/10"
                              onClick={() => {
                                const draftIds = visibleFiles.filter((f: any) => f.tag === 'draft').map((f: any) => f._id).join(',');
                                window.open(`/admin/print-drafts?ids=${draftIds}`, '_blank');
                              }}
                            >
                              <Printer className="w-4 h-4 mr-2" /> Print Drafts
                            </Button>
                          )}
                          <Button
                            variant="outline" 
                            size="sm" 
                            disabled={isGeneratingLink}
                            onClick={() => {
                              setShareTarget({
                                folderName: activeGroup.folderName,
                                taskId: activeGroup.taskId || undefined,
                                orderId: activeGroup.orderId || undefined,
                                userId: activeGroup.userId || undefined,
                              });
                            }}
                          >
                          <Share2 className="w-4 h-4 mr-2" /> {isGeneratingLink ? "Generating..." : "Share Link"}
                        </Button>
                        {activeGroup.taskId && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => window.open(`/admin/tasks?task=${activeGroup.taskId}`, '_blank')}
                          >
                            <LayoutGrid className="w-4 h-4 mr-2" /> View Task
                          </Button>
                        )}
                        {visibleFiles.length > 0 && (
                          <Button variant="secondary" size="sm" onClick={(e) => handleDownloadAll({ ...activeGroup, files: visibleFiles }, e)}>
                            <Download className="w-4 h-4 mr-2" /> Download All
                          </Button>
                        )}
                        {!activeSubFolderId && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateFolderModalOpen(true)}
                          >
                            <Folder className="w-4 h-4 mr-2" /> New Folder
                          </Button>
                        )}
                        <Button 
                          onClick={() => {
                            const inferredCategory = activeGroup.taskId ? "TASK" : (activeGroup.files?.length > 0 ? activeGroup.files[0].category : (activeTab !== "ALL" ? activeTab : "DIGITAL PRINTING"));
                            setUploadData({ userId: activeGroup.userId || "", orderId: activeGroup.orderId || "", category: inferredCategory, notes: "", taskId: activeGroup.taskId || "", folderId: activeSubFolderId || "" });
                            setUploadModalOpen(true);
                          }}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Artwork
                        </Button>
                      </div>
                  </div>

                  {!activeSubFolderId && (() => {
                    const users = (usersResponse as any)?.data || (usersResponse as any)?.users || [];
                    const activeTask = (taskDetailResponse as any)?.task || null;
                    const activeOrder = (orderDetailResponse as any)?.order || null;
                    const activeUser = activeTask?.assignee ? users.find((u: any) => u._id === activeTask.assignee) : null;

                    const descriptionText = activeTask?.description ? activeTask.description : (activeOrder?.items ? activeOrder.items.map((item: any) => `${item.name} (${item.quantity}x)`).join('\n') : "No description provided.");
                    const assigneeName = activeUser ? (activeUser.name || activeUser.email) : "Unassigned";
                    const categoryName = activeTask?.category ? activeTask.category.replace(/_/g, ' ') : "N/A";
                    const dueDate = activeTask?.dueDate ? format(new Date(activeTask.dueDate), 'dd MMM yyyy') : "N/A";

                    return (
                      <div className="flex flex-col xl:flex-row gap-6 mb-4 pb-4 border-b">
                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                          <div className="bg-muted/30 border rounded-lg p-3 sm:p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto [&_b]:font-black [&_b]:text-[16px] [&_strong]:font-black [&_strong]:text-[16px]" dangerouslySetInnerHTML={{ __html: descriptionText }} />
                        </div>

                        {/* Properties Grid */}
                        <div className="w-full xl:w-72 shrink-0">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Properties</h3>
                          <div className="bg-muted/30 border rounded-lg p-3 sm:p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><User className="w-3.5 h-3.5"/> Assignee</span>
                              <span className="text-xs font-semibold truncate max-w-[140px] text-right">{assigneeName}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><Tag className="w-3.5 h-3.5"/> Category</span>
                              <span className="text-xs font-semibold truncate max-w-[140px] text-right">{categoryName}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><Calendar className="w-3.5 h-3.5"/> Due Date</span>
                              <span className="text-xs font-semibold truncate max-w-[140px] text-right">{dueDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    return (
                      <>
                        {activeSubFolderId && (
                          <div className="flex items-center gap-2 mb-4 bg-muted/30 p-2 rounded-lg w-fit">
                            <Button variant="ghost" size="sm" onClick={() => setActiveSubFolderId(null)}><ChevronLeft className="w-4 h-4 mr-1"/> Back</Button>
                            <span className="text-sm font-semibold flex items-center"><Folder className="w-4 h-4 mr-2 text-primary"/> {currentFolder?.name}</span>
                          </div>
                        )}
                        {visibleFiles.length === 0 && visibleFolders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/20">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                              <Folder className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Folder is empty</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                              There are no artworks or sub-folders here yet.
                            </p>
                            <Button 
                              onClick={() => {
                                const inferredCategory = activeGroup.taskId ? "TASK" : (activeTab !== "ALL" ? activeTab : "DIGITAL PRINTING");
                                setUploadData({ userId: activeGroup.userId || "", orderId: activeGroup.orderId || "", category: inferredCategory, notes: "", taskId: activeGroup.taskId || "", folderId: activeSubFolderId || "" });
                                setUploadModalOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Artwork
                            </Button>
                          </div>
                        ) : (
                          <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" : "flex flex-col gap-3"}>
                            {visibleFolders.map((folder: any) => (
                              viewMode === "grid" ? (
                                <Card
                                  key={folder._id}
                                  onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setDragOverSubFolderId(folder._id); }}
                                  onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; }}
                                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverSubFolderId(null); }}
                                  onDrop={(event) => void handleArtworkDrop(event, folder._id)}
                                  className={`overflow-hidden shadow-sm hover:shadow-md cursor-pointer relative bg-card hover:bg-accent/50 border-primary/20 flex flex-col h-full min-h-[250px] ${dragOverSubFolderId === folder._id ? "ring-2 ring-primary bg-primary/10" : ""}`}
                                  onClick={() => setActiveSubFolderId(folder._id)}
                                >
                                  <div className="absolute top-2 right-10 z-20">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-50 hover:text-blue-600 bg-white/50" onClick={(e) => { e.stopPropagation(); setRenameFolderTarget({ id: folder._id, name: folder.name, type: "subfolder" }); setRenamedFolderName(folder.name); }} title="Rename Folder">
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="absolute top-2 right-2 z-20">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 bg-white/50" onClick={(e) => { e.stopPropagation(); if(confirm('Delete folder and ALL files inside it? This cannot be undone.')) deleteFolderMutate(folder._id); }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
                                    <Folder className="w-16 h-16 text-primary/70 mb-3" fill="currentColor" />
                                    <span className="text-sm font-semibold text-center line-clamp-2 w-full">{folder.name}</span>
                                  </div>
                                </Card>
                              ) : (
                                <div
                                  key={folder._id}
                                  onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setDragOverSubFolderId(folder._id); }}
                                  onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; }}
                                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverSubFolderId(null); }}
                                  onDrop={(event) => void handleArtworkDrop(event, folder._id)}
                                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 cursor-pointer ${dragOverSubFolderId === folder._id ? "ring-2 ring-primary bg-primary/10" : ""}`}
                                  onClick={() => setActiveSubFolderId(folder._id)}
                                >
                                   <div className="flex items-center gap-4 min-w-0 flex-1">
                                     <Folder className="w-8 h-8 text-primary/70" fill="currentColor" />
                                     <span className="text-sm font-medium">{folder.name}</span>
                                   </div>
                                   <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); setRenameFolderTarget({ id: folder._id, name: folder.name, type: "subfolder" }); setRenamedFolderName(folder.name); }} title="Rename Folder">
                                     <Pencil className="w-4 h-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); if(confirm('Delete folder and ALL files inside it? This cannot be undone.')) deleteFolderMutate(folder._id); }}>
                                     <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            ))}
                            {visibleFiles.map((file: any) => (
                    viewMode === "grid" ? (
                      <Card
                        key={file._id}
                        draggable
                        onDragStart={(event) => handleArtworkDragStart(event, file._id)}
                        onDragEnd={() => { setDraggedArtworkFileIds([]); setDragOverSubFolderId(null); }}
                        className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing ${selectedFiles.includes(file._id) ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                      >
                        <div className="absolute top-2 left-2 z-30">
                          <Checkbox 
                            checked={selectedFiles.includes(file._id)} 
                            onCheckedChange={() => handleSelectFile(file._id)} 
                            className="bg-white/80 data-[state=checked]:bg-primary"
                          />
                        </div>
                        {getFileThumbnail(file, visibleFiles)}
                        {file.tag === 'draft' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Draft</div>
                        ) : file.tag === 'for_print' ? (
                          <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">For Print</div>
                        ) : file.tag === 'awb' ? (
                          <div className="absolute top-0 right-0 bg-red-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">AWB</div>
                        ) : file.tag === 'attachment' ? (
                          <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Attachment</div>
                        ) : null}
                        <div className={`absolute right-2 z-30 ${file.tag ? 'top-6' : 'top-2'}`}>
                          <Button variant="secondary" size="icon" className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-all hover:scale-105" onPointerEnter={() => prepareSharePreview(file)} onFocus={() => prepareSharePreview(file)} onClick={(e) => handleCopyLink(e, file)} title="Copy Share Link">
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <CardHeader className="p-4 pb-2 flex flex-col items-start justify-between bg-muted/5 border-b">
                          <div className="overflow-hidden w-full">
                            {editingFileId === file._id ? (
                                <Input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={() => {
                                  if (editingName !== file.originalName) { renameFileMutate({ id: file._id, originalName: editingName }); }
                                  setEditingFileId(null);
                                }} onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur(); }} className="h-7 text-sm" />
                              ) : (
                                <CardTitle className="text-[10px] truncate w-full cursor-pointer hover:underline flex items-center gap-2" title={file.originalName} onClick={() => { setEditingFileId(file._id); setEditingName(file.originalName); }}>
                                  {file.originalName}
                                  
                                </CardTitle>
                              )}
                            <CardDescription className="text-[9px] truncate w-full">
                              User: {activeGroup.folderName}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 flex flex-col gap-3">
                          <div className="text-xs text-muted-foreground flex justify-between items-center">
                            <span className="bg-muted px-2 py-1 rounded-md">{file.category || "Uncategorized"}</span>
                            <span className={file.adminReviewed ? "text-green-500 font-semibold" : "text-amber-500 font-semibold"}>
                              {file.adminReviewed ? "Reviewed" : "Pending"}
                            </span>
                          </div>
                          
                          {file.adminNotes && (
                            <div className="text-xs bg-primary/10 text-primary p-2 rounded-md italic flex items-start gap-2">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                              <span title={file.adminNotes}>{file.adminNotes}</span>
                            </div>
                          )}
                          
                          {file.notes && (
                            <div className="text-xs bg-amber-50 text-amber-600 p-2 rounded-md italic flex items-start gap-2 border border-amber-100">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                              <span title={file.notes}>Customer: {file.notes}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2 mt-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => {
                              setSelectedFile(file);
                              setCommentText(file.adminNotes || "");
                              setCommentModalOpen(true);
                            }}>
                              <MessageSquare className="w-4 h-4 mr-1" /> Note
                            </Button>
                            <Button variant="secondary" size="sm" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              forceDownload(getFileUrl(file.path), file.originalName);
                            }}>
                              <Download className="w-4 h-4 mr-1" /> Download
                            </Button>
                            
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(file._id)} disabled={isDeleting}>
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        key={file._id}
                        draggable
                        onDragStart={(event) => handleArtworkDragStart(event, file._id)}
                        onDragEnd={() => { setDraggedArtworkFileIds([]); setDragOverSubFolderId(null); }}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-grab active:cursor-grabbing ${selectedFiles.includes(file._id) ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Checkbox 
                            checked={selectedFiles.includes(file._id)} 
                            onCheckedChange={() => handleSelectFile(file._id)} 
                          />
                          {getFileIcon(file.mimetype)}
                          <div className="min-w-0 flex-1">
                            {editingFileId === file._id ? (
                                <Input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={() => {
                                  if (editingName !== file.originalName) { renameFileMutate({ id: file._id, originalName: editingName }, { onSuccess: () => window.location.reload() }); }
                                  setEditingFileId(null);
                                }} onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur(); }} className="h-7 text-sm w-1/2" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium truncate cursor-pointer hover:underline" title={file.originalName} onClick={() => { setEditingFileId(file._id); setEditingName(file.originalName); }}>{file.originalName}</h4>
                                  
                                </div>
                              )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="bg-muted px-1.5 py-0.5 rounded">{file.category || "Uncategorized"}</span>
                              <span className={file.adminReviewed ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                                {file.adminReviewed ? "Reviewed" : "Pending"}
                              </span>
                              {file.adminNotes && (
                                <span className="flex items-center gap-1 text-primary truncate" title={file.adminNotes}>
                                  <MessageSquare className="w-3 h-3" /> {file.adminNotes}
                                </span>
                              )}
                              {file.notes && (
                                <span className="flex items-center gap-1 text-amber-600 truncate" title={file.notes}>
                                  <MessageSquare className="w-3 h-3" /> Customer: {file.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => { setPreviewFile(file); setPreviewList(visibleFiles); }} title="View">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-blue-50" onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          forceDownload(getFileUrl(file.path), file.originalName);
                        }} title="Download">
                          <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="default" size="icon" onPointerEnter={() => prepareSharePreview(file)} onFocus={() => prepareSharePreview(file)} onClick={(e) => handleCopyLink(e, file)} title="Copy Share Link">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedFile(file);
                            setCommentText(file.adminNotes || "");
                            setCommentModalOpen(true);
                          }} title="Add Note">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(file._id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                )}
              </>
            );
          })()}
              </div>
            );
          })()}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center space-y-5 bg-muted/10">
              <div className="w-24 h-24 bg-background border rounded-full flex items-center justify-center shadow-sm">
                <Folder className="w-12 h-12 text-muted-foreground/40" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Folder</h3>
                <p className="text-sm max-w-sm mx-auto text-muted-foreground/80 leading-relaxed">
                  Click on a folder from the list on the left to view artworks, manage sub-folders, and upload files.
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

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

      {/* Comment Modal */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your notes or feedback here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveComment}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Folder Modal */}
      <Dialog open={createFolderModalOpen} onOpenChange={setCreateFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub-Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Folder Name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Drafts, Raw Images"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderModalOpen(false)}>Cancel</Button>
            <Button 
              disabled={isCreatingFolder || !newFolderName.trim()} 
              onClick={() => {
                const activeGroup = groupedFromServer.find((g: any) => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
                if (activeGroup) {
                  createFolderMutate(
                    { name: newFolderName, taskId: activeGroup.taskId, userId: activeGroup.userId },
                    { 
                      onSuccess: () => { 
                        setCreateFolderModalOpen(false); 
                        setNewFolderName(""); 
                      } 
                    }
                  );
                }
              }}
            >
              {isCreatingFolder ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameFolderTarget} onOpenChange={(open) => { if (!open) setRenameFolderTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Folder Name</Label>
            <Input
              autoFocus
              value={renamedFolderName}
              onChange={(e) => setRenamedFolderName(e.target.value)}
              placeholder="Folder name"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderTarget(null)}>Cancel</Button>
            <Button
              disabled={isRenamingFolder || isUpdatingTask || !renamedFolderName.trim() || renamedFolderName.trim() === renameFolderTarget?.name}
              onClick={() => {
                if (!renameFolderTarget) return;
                const name = renamedFolderName.trim();
                const onSuccess = () => {
                  setRenameFolderTarget(null);
                  toast.success("Folder renamed");
                };
                if (renameFolderTarget.type === "task") {
                  updateTask({ id: renameFolderTarget.id, data: { title: name } }, { onSuccess });
                } else {
                  renameFolderMutate({ id: renameFolderTarget.id, name }, { onSuccess });
                }
              }}
            >
              {isRenamingFolder || isUpdatingTask ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Modal */}
      <Dialog open={moveToFolderModalOpen} onOpenChange={setMoveToFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.length} item(s)</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {(() => {
              const activeGroup = groupedFromServer.find((g: any) => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
              const groupFolders = activeGroup ? virtualFolders.filter((f: any) => 
                activeGroup.taskId ? f.taskId === activeGroup.taskId : f.userId === activeGroup.userId
              ) : [];

              return (
                <>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-3 h-12 w-full"
                    onClick={async () => {
                      for (const fileId of selectedFiles) {
                        await moveFileMutate({ fileId, folderId: null });
                      }
                      setMoveToFolderModalOpen(false);
                      setSelectedFiles([]);
                    }}
                  >
                    <Folder className="w-5 h-5 text-muted-foreground" fill="currentColor" />
                    <span>Root Folder</span>
                  </Button>
                  {groupFolders.map((folder: any) => (
                    <Button 
                      key={folder._id}
                      variant="outline" 
                      className="justify-start gap-3 h-12 w-full"
                      onClick={async () => {
                        for (const fileId of selectedFiles) {
                          await moveFileMutate({ fileId, folderId: folder._id });
                        }
                        setMoveToFolderModalOpen(false);
                        setSelectedFiles([]);
                      }}
                    >
                      <Folder className="w-5 h-5 text-primary/70" fill="currentColor" />
                      <span>{folder.name}</span>
                    </Button>
                  ))}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveToFolderModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} files={previewList} onNavigate={setPreviewFile} />

      {pendingArtworkDrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPendingArtworkDrop(null)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Upload {pendingArtworkDrop.length} file{pendingArtworkDrop.length > 1 ? 's' : ''}</h3>
            <p className="text-sm text-muted-foreground mb-5">What type of file is this?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-slate-500/25 bg-slate-500/5 p-3 text-center transition hover:border-slate-500/60 hover:bg-slate-500/10"
                onClick={() => { uploadArtworkDroppedFiles(pendingArtworkDrop, 'attachment'); setPendingArtworkDrop(null); }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500 text-white">
                  <Paperclip className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground">Attachment</span>
              </button>
              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-3 text-center transition hover:border-orange-500/60 hover:bg-orange-500/10"
                onClick={() => { uploadArtworkDroppedFiles(pendingArtworkDrop, 'draft'); setPendingArtworkDrop(null); }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <File className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground">Draft</span>
              </button>
              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-green-500/25 bg-green-500/5 p-3 text-center transition hover:border-green-500/60 hover:bg-green-500/10"
                onClick={() => { uploadArtworkDroppedFiles(pendingArtworkDrop, 'for_print'); setPendingArtworkDrop(null); }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                  <Printer className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground">For Print</span>
              </button>
              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-3 text-center transition hover:border-red-500/60 hover:bg-red-500/10"
                onClick={() => { uploadArtworkDroppedFiles(pendingArtworkDrop, 'awb'); setPendingArtworkDrop(null); }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground">AWB</span>
              </button>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setPendingArtworkDrop(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
