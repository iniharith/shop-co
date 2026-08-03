/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useMemo } from "react";
import { useFolderGroup, useFilesByFolder, useReviewFile, useDeleteFile, useBulkDeleteFiles, useCreateShareLink, useFolders } from "@/hooks/useAdminDashboard";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrder";
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, Download, Eye, CircleCheck, Trash2, Search, X, MessageSquare, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, User, Tag, Calendar, Link, Share2, CheckSquare, Printer } from "lucide-react";
import { forceDownload } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { FilePreviewModal } from "@/components/global/FilePreviewModal";
import ImageNext from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import AxiosInstance from "@/utils/axios";
import { uploadFilesToS3Directly } from "@/utils/s3Upload";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingAnimation from "@/components/global/LoadingAnimation";
import { useLowPowerAnimations } from "@/hooks/useLowPowerAnimations";
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

// Packaging only ever deals with one status, so there are no sub-tabs (unlike Production's Printing/Hold/Done Printing)
const PACKAGING_STATUS = "PACKAGING";
const PACKAGING_STATUSES = ["PACKAGING"];

const getFolderItemKey = (index: number, group: any) =>
  group.taskId
    ? `task:${group.taskId}`
    : group.orderId
      ? `order:${group.orderId}`
      : group.userId
        ? `user:${group.userId}`
        : `folder:${group.folderName || "unnamed"}:${index}`;

export default function PackagingManager() {
  const lowPower = useLowPowerAnimations();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { data: folderGroupResponse, isPending: folderGroupPending, refetch, isFetching } = useFolderGroup(PACKAGING_STATUSES);
  const groupedFromServer: any[] = (folderGroupResponse as any)?.data || [];
  const selectedGroup = useMemo(() => groupedFromServer.find(
    group => `${group.folderName}-${group.orderId}-${group.taskId || ""}` === selectedFolder
  ), [groupedFromServer, selectedFolder]);
  const { data: orderDetailResponse } = useOrder(!selectedGroup?.taskId ? selectedGroup?.orderId : undefined);
  const { data: taskDetailResponse } = useTask(selectedGroup?.taskId);
  const { mutate: updateTask } = useUpdateTask();
  const { data: usersResponse } = useUsers(!!selectedFolder);
  const { mutateAsync: createShareLink, isPending: isGeneratingLink } = useCreateShareLink();

  const { data: virtualFoldersResponse } = useFolders(!!selectedFolder);
  const virtualFolders = (virtualFoldersResponse as any)?.data || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  // Fixed sub-tab — Packaging has no Printing/Hold/Done Printing tabs like Production does
  const [activeSubTab, setActiveSubTab] = useState("PACKAGING");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [activeSubFolderId, setActiveSubFolderId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [shareTarget, setShareTarget] = useState<{
    folderName: string;
    taskId?: string;
    orderId?: string;
    userId?: string;
    folderId?: string;
  } | null>(null);

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

  // Bulk status move state
  const [bulkSelectMode, setBulkSelectMode] = useState<boolean>(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>("SHIPPED");
  const ALL_MOVE_STATUSES = ["PLACED", "IN_PROGRESS", "PENDING_ARTWORK", "ARTWORK_REVIEWED", "ARTWORK_REJECTED", "IN_DESIGN", "PEMBETULAN", "DONE_DESIGN", "IN_PRODUCTION", "HOLD_PRINTING", "DONE_PRINTING", "PACKAGING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED", "RETURN"];

  // Optimistic removal — folders removed instantly from UI when tick button is clicked
  const [movedFolderIds, setMovedFolderIds] = useState<Set<string>>(new Set());

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteFiles();

  const { mutate: updateOrderStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

  const handleBulkStatusMove = () => {
    if (selectedFolderIds.length === 0) return;
    if (!confirm(`Move ${selectedFolderIds.length} folder(s) to "${bulkTargetStatus.replace(/_/g, ' ')}"?`)) return;

    const targets = groupedFiles.filter((g: any) => selectedFolderIds.includes(`${g.folderName}-${g.orderId}-${g.taskId || ""}`));
    // Optimistic: remove all selected folders instantly
    setMovedFolderIds(prev => new Set([...prev, ...selectedFolderIds]));
    setSelectedFolder(null);
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
        updateTask({ id: group.taskId, data: { status: bulkTargetStatus } }, { onSuccess: finish, onError: finish });
      } else if (group.orderId) {
        updateOrderStatus({ id: group.orderId, status: bulkTargetStatus }, { onSuccess: finish, onError: finish });
      } else {
        finish();
      }
    });
  };

  // The backend returns this queue as a compact folder index. Keeping the
  // grouping server-side makes navigation fast and preserves cached results.
  const groupedFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groupedFromServer.filter((group: any) => {
      const folderId = `${group.folderName}-${group.orderId}-${group.taskId || ""}`;
      if (movedFolderIds.has(folderId)) return false; // optimistic removal
      if (group.orderStatus !== activeSubTab) return false;
      if (activeTab !== "ALL" && group.category !== activeTab && group.files?.[0]?.category !== activeTab) return false;
      if (!query) return true;
      return group.folderName?.toLowerCase().includes(query)
        || group.orderId?.toLowerCase().includes(query)
        || group.taskId?.toLowerCase().includes(query)
        || group.files?.some((file: any) => file.originalName?.toLowerCase().includes(query));
    });
  }, [groupedFromServer, searchQuery, activeTab, activeSubTab, movedFolderIds]);

  // Once a folder is opened, fetch its full file details on demand — the
  // folder LIST only ever needed names/counts, which the slim index above
  // already provides fast.
  const activeFolderIdentity = useMemo(() => {
    if (!selectedFolder) return null;
    const g = groupedFiles.find(g => `${g.folderName}-${g.orderId}-${g.taskId || ""}` === selectedFolder);
    if (!g) return null;
    return g.taskId
      ? { taskId: g.taskId }
      : { orderId: g.orderId || null, userId: g.userId || null };
  }, [selectedFolder, groupedFiles]);

  const { data: folderFilesResponse, isPending: isFolderFilesPending } = useFilesByFolder(activeFolderIdentity);
  const activeFolderFiles: any[] = (folderFilesResponse as any)?.data || [];

  React.useEffect(() => {
    setActiveSubFolderId(null);
  }, [selectedFolder]);

  React.useEffect(() => {
    const folderQuery = searchParams.get("folder");
    if (folderQuery && groupedFiles.length > 0 && !selectedFolder) {
      const match = groupedFiles.find(g => g.folderName === folderQuery || g.taskId === folderQuery);
      if (match) {
        const id = `${match.folderName}-${match.orderId}-${match.taskId || ""}`;
        setSelectedFolder(id);
      }
    }
  }, [searchParams, groupedFiles, selectedFolder]);

  const handleReview = (fileId: string, currentStatus: boolean, notes?: string) => {
    reviewFileMutate(
      { id: fileId, reviewed: !currentStatus, notes },
      {
        onSuccess: () => {
          toast.success("File status updated!");
          window.location.reload();
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
          toast.success("Note saved successfully!");
          setCommentModalOpen(false);
          window.location.reload();
        },
      }
    );
  };

  const handleStatusChange = (group: any, newStatus: string) => {
    if (group.isTask) {
      updateTask({ id: group.taskId, data: { status: newStatus } }, {
        onSuccess: () => toast.success("Task status updated!"),
        onError: () => toast.error("Failed to update task status")
      });
    } else {
      updateOrderStatus({ id: group.orderId, status: newStatus }, {
        onSuccess: () => toast.success("Order status updated!"),
        onError: () => toast.error("Failed to update order status")
      });
    }
  };

  const handleDownloadAll = async (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading("Preparing ZIP...");
    const downloadId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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
        body: JSON.stringify({ fileIds, zipName: group.folderName || "packaging", downloadId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Could not download any files");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${group.folderName || "packaging"}.zip`;
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

  const handleAdvanceFlow = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic: instantly remove from list and clear selection
    const folderId = `${group.folderName}-${group.orderId}-${group.taskId || ""}`;
    setMovedFolderIds(prev => new Set([...prev, folderId]));
    setSelectedFolder(null);

    if (group.taskId) {
      updateTask({ id: group.taskId, data: { status: "SHIPPED" } }, {
        onSuccess: () => toast.success("✅ Moved to Shipped!"),
        onError: () => {
          toast.error("Failed to update status");
          setMovedFolderIds(prev => { const s = new Set(prev); s.delete(folderId); return s; });
        }
      });
    } else if (group.orderId) {
      updateOrderStatus({ id: group.orderId, status: "SHIPPED" }, {
        onSuccess: () => toast.success("✅ Moved to Shipped!"),
        onError: () => {
          toast.error("Failed to update status");
          setMovedFolderIds(prev => { const s = new Set(prev); s.delete(folderId); return s; });
        }
      });
    }
  };

  const handleDelete = (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    deleteFileMutate(fileId, {
      onSuccess: () => {
        toast.success("File deleted!");
      },
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
        category: uploadData.category || "DIGITAL PRINTING",
        notes: uploadData.notes || undefined,
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

  const getFileThumbnail = (file: any) => {
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
            <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); }} className="gap-1 shadow-sm">
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
        <div className="w-full h-24 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center relative group">
          <FileText className="w-10 h-10 text-red-500" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); }} className="gap-1 shadow-sm">
              <Eye className="w-4 h-4" /> View
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-24 bg-muted/50 rounded-t-lg flex items-center justify-center relative group">
        {getFileIcon(file.mimetype)}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(file); }} className="gap-1 shadow-sm">
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

  if (!groupedFromServer.length && folderGroupPending) return <LoadingAnimation fullScreen={false} label="Loading files" />;

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
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="shrink-0" title="Refresh Packaging Files">
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
            if (!isUploading) setUploadModalOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Upload File</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File for Packaging</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={uploadData.category} onChange={e => setUploadData({ ...uploadData, category: e.target.value })}>
                    {categories.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Files *</Label>
                  <Input type="file" multiple disabled={isUploading} onChange={e => setUploadFiles(e.target.files)} />
                </div>
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea placeholder="Internal notes..." value={uploadData.notes} onChange={e => setUploadData({ ...uploadData, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" disabled={isUploading} onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                <Button disabled={isUploading} onClick={handleUploadSubmit}>{isUploading ? "Uploading..." : "Upload"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start mb-2">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {groupedFiles.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl bg-card">
          No files in packaging right now.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[600px]">
          
          {/* LEFT PANEL (MASTER) */}
          <div className="w-full lg:w-1/3 xl:w-1/4 border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden h-full min-h-0">
            <div className="p-4 border-b bg-muted/30 font-semibold text-sm flex justify-between items-center shrink-0 gap-2">
              <span>Task Folders</span>
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{groupedFiles.length}</span>
                <Button
                  variant={bulkSelectMode ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setBulkSelectMode(v => !v); setSelectedFolderIds([]); }}
                  title="Move multiple folders to a status in one click"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1" /> Bulk Move
                </Button>
              </div>
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
                    {ALL_MOVE_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    disabled={selectedFolderIds.length === 0 || isUpdatingStatus}
                    onClick={handleBulkStatusMove}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <Virtuoso
                className="h-full"
                data={groupedFiles}
                computeItemKey={getFolderItemKey}
                increaseViewportBy={lowPower ? 0 : { top: 200, bottom: 400 }}
                itemContent={(index, group) => {
                  const folderId = `${group.folderName}-${group.orderId}-${group.taskId || ""}`;
                  const isSelected = selectedFolder === folderId;
                  const isBulkChecked = selectedFolderIds.includes(folderId);
                  return (
                    <div className={`px-3 pb-2 ${index === 0 ? "pt-3" : ""}`}>
                      <div
                     className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/10 border-l-4 border-primary shadow-sm' 
                        : 'border border-transparent hover:bg-muted'
                    }`}
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
                    <div className="w-10 h-10 rounded-md shrink-0 relative overflow-hidden bg-primary/5 flex items-center justify-center">
                      {getFolderPreview(group, "w-10 h-10")}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-sm line-clamp-2 leading-tight" title={group.folderName}>{group.folderName}</h3>
                       {group.orderId && <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">Order: {group.orderId}</p>}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-medium bg-background border px-1.5 py-0.5 rounded-full">{group.fileCount} file(s)</span>
                       <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-primary translate-x-1' : 'text-muted-foreground'}`} />
                       </div>
                     </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>

          {/* RIGHT PANEL (DETAIL) */}
          <div className="w-full lg:w-2/3 xl:w-3/4 min-w-0 border rounded-xl bg-card shadow-sm flex flex-col overflow-hidden h-full">
            {selectedFolder ? (() => {
              const activeGroup = groupedFiles.find(g => `${g.folderName}-${g.orderId}-${g.taskId || ""}` === selectedFolder);
              if (!activeGroup) {
                setTimeout(() => setSelectedFolder(null), 0);
                return null;
              }
              
              const groupFolders = virtualFolders.filter((f: any) => {
                if (activeGroup.taskId) return f.taskId === activeGroup.taskId;
                if (activeGroup.orderId) return f.orderId === activeGroup.orderId;
                return f.userId === activeGroup.userId && !f.taskId && !f.orderId;
              });
              const allGroupFiles = activeFolderFiles;
              const visibleFiles = allGroupFiles.filter((f: any) => 
                activeSubFolderId ? f.folderId === activeSubFolderId : (!f.folderId || f.folderId === 'null')
              );

              if (isFolderFilesPending && allGroupFiles.length === 0) {
                return (
                  <div className="flex justify-center items-center h-[40vh]">
                    <LoadingAnimation fullScreen={false} label="Loading folder" />
                  </div>
                );
              }
              
              const users = (usersResponse as any)?.users || [];
              const activeTask = (taskDetailResponse as any)?.task || null;
              const activeOrder = (orderDetailResponse as any)?.order || null;
              const activeUser = activeTask?.assignee ? users.find((u: any) => u._id === activeTask.assignee) : null;
              
              const descriptionText = activeTask?.description ? activeTask.description : (activeOrder?.items ? activeOrder.items.map((item: any) => `${item.name} (${item.quantity}x)`).join('\n') : "No description provided.");
              const assigneeName = activeUser ? (activeUser.name || activeUser.email) : "Unassigned";
              const categoryName = activeTask?.category ? activeTask.category.replace(/_/g, ' ') : "N/A";
              const dueDate = activeTask?.dueDate ? format(new Date(activeTask.dueDate), 'dd MMM yyyy') : "N/A";

              return (
                <div className="flex flex-col h-full min-w-0">
                  <div className="p-4 sm:p-6 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shrink-0 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 truncate">
                        <Folder className="w-6 h-6 text-primary shrink-0" />
                        <span className="truncate">{activeGroup.folderName}</span>
                      </h2>
                      {(activeGroup.orderId || activeGroup.taskId) && (
                        <p className="text-sm font-bold text-foreground/80 mt-1.5 bg-background border px-2 py-1 rounded-md inline-block">
                          {activeGroup.taskId ? `Task ID: ${activeGroup.taskId}` : `Order ID: ${activeGroup.orderId}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0 shrink-0">
                      <div className="flex items-center gap-2 bg-background border rounded-md p-1 pl-3 shadow-sm">
                        <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                        <select 
                          className="h-9 text-sm font-bold bg-transparent border-0 rounded px-2 focus:ring-0 w-full sm:w-40"
                          value={activeGroup.orderStatus}
                          onChange={(e) => {
                            if (activeGroup.isTask && activeGroup.taskId) {
                              handleStatusChange(activeGroup, e.target.value);
                            } else if (activeGroup.orderId) {
                              updateOrderStatus({ id: activeGroup.orderId, status: e.target.value }, {
                                onSuccess: () => toast.success("Order status updated!")
                              });
                            }
                          }}
                          disabled={isUpdatingStatus}
                        >
                          {['PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={(e) => handleAdvanceFlow(activeGroup, e)} 
                        className="shadow-sm h-11 sm:h-10 border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Mark as Shipped"
                      >
                        <CheckCircle className="w-5 h-5 sm:mr-2" /> 
                        <span className="hidden sm:inline">Shipped</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        disabled={isGeneratingLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareTarget({
                            folderName: activeGroup.folderName,
                            taskId: activeGroup.taskId || undefined,
                            orderId: activeGroup.orderId || undefined,
                            userId: activeGroup.userId || undefined,
                            folderId: activeSubFolderId || undefined,
                          });
                        }} 
                        className="shadow-sm h-11 sm:h-10 border-primary/20 text-primary hover:bg-primary/10"
                        title="Copy Share Link"
                      >
                        <Share2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{isGeneratingLink ? "Generating..." : "Share"}</span>
                      </Button>
                      <Button variant="secondary" onClick={(e) => handleDownloadAll(activeGroup, e)} className="shadow-sm h-11 sm:h-10">
                        <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </div>

                  {/* Task / Order Details Card */}
                  <div className="px-4 sm:px-6 py-4 border-b bg-card min-w-0">
                    <div className="flex flex-col 2xl:flex-row gap-6">
                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                        <div className="bg-muted/30 border rounded-lg p-3 sm:p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                          {descriptionText}
                        </div>
                      </div>
                      
                      {/* Properties Grid */}
                      <div className="w-full 2xl:w-72 shrink-0">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Properties</h3>
                        <div className="bg-muted/30 border rounded-lg p-3 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Assignee</span>
                            <span className="text-xs font-semibold truncate max-w-[120px] text-right">{assigneeName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Category</span>
                            <span className="text-xs font-semibold truncate max-w-[120px] text-right">{categoryName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Due Date</span>
                            <span className="text-xs font-semibold truncate max-w-[120px] text-right">{dueDate}</span>
                          </div>
                          
                          <div className="pt-3 mt-3 border-t flex flex-wrap gap-2">
                            {activeGroup.orderId && (
                              <a href={`/admin/orders?search=${activeGroup.orderId}`} target="_blank" className="flex-1 text-center bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors">
                                View Order
                              </a>
                            )}
                            {activeGroup.taskId && (
                              <a href={`/admin/tasks?task=${activeGroup.taskId}`} target="_blank" className="flex-1 text-center bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors">
                                View Task
                              </a>
                            )}
                            {(activeGroup.orderId || activeGroup.folderName) && (
                              <a href={`/admin/artworks?folder=${encodeURIComponent(activeGroup.folderName)}`} target="_blank" className="flex-1 text-center bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors">
                                Artworks
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0 bg-background/50 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        {activeSubFolderId ? "Subfolder Contents" : `${activeGroup.fileCount} Attachments`}
                      </h3>
                      {activeSubFolderId && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveSubFolderId(null)}>
                          <ChevronLeft className="w-4 h-4 mr-1"/> Back
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {/* Render Folders */}
                      {!activeSubFolderId && groupFolders.map((folder: any) => (
                        <Card key={folder._id} className="overflow-hidden shadow-sm hover:shadow-md cursor-pointer relative bg-card hover:bg-accent/50 border-primary/20 flex flex-col h-full min-h-[250px]" onClick={() => setActiveSubFolderId(folder._id)}>
                          <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3">
                            <Folder className="w-16 h-16 text-primary/80" />
                            <h3 className="font-semibold text-sm text-center line-clamp-2">{folder.name}</h3>
                          </div>
                          <div className="bg-muted/50 p-2 text-center text-xs text-muted-foreground border-t">
                            {activeGroup.files.filter((f: any) => f.folderId === folder._id).length} files
                          </div>
                        </Card>
                      ))}

                      {/* Render Files */}
                      {visibleFiles.map((file: any) => (
                        <Card key={file._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow relative bg-background border-muted group/card">
                          {getFileThumbnail(file)}
                          {file.tag === 'draft' ? (
                            <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Draft</div>
                          ) : file.tag === 'for_print' ? (
                            <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">For Print</div>
                          ) : file.tag === 'attachment' ? (
                            <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Attachment</div>
                          ) : null}
                          <CardHeader className="p-3 pb-2 border-b bg-muted/10">
                            <CardTitle className="text-xs truncate w-full" title={file.originalName}>
                              {file.originalName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 flex flex-col gap-2">
                            <Button variant="secondary" size="sm" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 h-9 font-semibold" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              forceDownload(getFileUrl(file.path), file.originalName);
                            }}>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center space-y-5 bg-muted/10">
                <div className="w-24 h-24 bg-background border rounded-full flex items-center justify-center shadow-sm">
                  <Folder className="w-12 h-12 text-muted-foreground/40" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a Task</h3>
                  <p className="text-sm max-w-sm mx-auto text-muted-foreground/80 leading-relaxed">
                    Click on a folder from the list on the left to view its task details, update its status, and download files for packaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
      <FilePreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />

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
    </div>
  );
}
