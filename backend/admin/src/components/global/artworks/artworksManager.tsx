/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useMemo } from "react";
import { useAllFiles, useReviewFile, useDeleteFile, useBulkDeleteFiles, useRenameFile, useCreateShareLink, useFolders, useCreateFolder, useDeleteFolder, useMoveFile } from "@/hooks/useAdminDashboard";
import JSZip from "jszip";
import { useOrders } from "@/hooks/useOrder";
import { useUsers } from "@/hooks/useUsers";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, Download, Eye, CircleCheck, Trash2, Search, X, MessageSquare, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, Printer, Share2 } from "lucide-react";
import { forceDownload } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageNext from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AxiosInstance from "@/utils/axios";
import { uploadToS3Directly } from "@/utils/s3Upload";

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

export default function ArtworksManager() {
  const { data: session } = useSession();
  const { data: response, isPending, refetch, isFetching: isFetchingFiles } = useAllFiles();
  const { data: ordersResponse, isFetching: isFetchingOrders } = useOrders();
  const { data: usersResponse, isPending: usersPending } = useUsers();
  const { data: tasksResponse, isPending: tasksPending } = useTasks();
  const { mutateAsync: createShareLink, isPending: isGeneratingLink } = useCreateShareLink();
  const searchParams = useSearchParams();

  const isFetching = isFetchingFiles || isFetchingOrders;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "", taskId: "", folderId: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  // Subfolder State
  const [activeSubFolderId, setActiveSubFolderId] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveToFolderModalOpen, setMoveToFolderModalOpen] = useState(false);

  const { data: virtualFoldersResponse, isPending: foldersPending } = useFolders();
  const virtualFolders = virtualFoldersResponse?.data || [];
  const { mutate: createFolderMutate, isPending: isCreatingFolder } = useCreateFolder();
  const { mutate: deleteFolderMutate, isPending: isDeletingFolder } = useDeleteFolder();
  const { mutate: moveFileMutate, isPending: isMovingFile } = useMoveFile();

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteFiles();
  const { mutate: renameFileMutate } = useRenameFile();

  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOverFolder, setIsDragOverFolder] = useState<boolean>(false);

  const allFiles: any[] = (response as any)?.data || [];

  const filteredFiles = useMemo(() => {
    let result = allFiles;
    const tasks = (tasksResponse as any)?.tasks || [];
    if (activeTab !== "ALL") {
      result = result.filter((f: any) => {
        if (f.category === 'TASK' && f.taskId) {
          const task = tasks.find((t: any) => t._id === f.taskId);
          return task?.category === activeTab;
        }
        return f.category === activeTab;
      });
    }

    // Hide background images from Artworks Manager
    result = result.filter((file: any) => file.category !== "UI_BACKGROUND");

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;

    return result.filter((file: any) => {
      const nameMatch = file.originalName?.toLowerCase().includes(q);
      const idMatch = file.userId?.toString().toLowerCase().includes(q);
      const shortIdMatch = file.userId?.toString().slice(-6).toLowerCase().includes(q);
      const orderMatch = file.orderId?.toString().toLowerCase().includes(q);
      return nameMatch || idMatch || shortIdMatch || orderMatch;
    });
  }, [allFiles, searchQuery, activeTab]);

  const groupedFiles = useMemo(() => {
    const orders = ordersResponse?.orders || [];
    const users = usersResponse?.users || [];
    const tasks = (tasksResponse as any)?.tasks || [];
    const groups: Record<string, any[]> = {};
    filteredFiles.forEach((file: any) => {
      let groupName = "Unassigned";
      let orderIdStr = "";
      
      let shouldExclude = false;

      let taskIdStr = "";

      if (file.category === 'TASK' && file.taskId) {
        const task = tasks.find((t: any) => t._id === file.taskId);
        groupName = task ? task.title : "Deleted Task";
        orderIdStr = task?.orderId || "";
        taskIdStr = file.taskId;
        
        if (task && (task.status === 'IN_PRODUCTION' || task.status === 'CANCELLED' || task.status === 'FAILED')) {
            shouldExclude = true;
        }
      } else {
        // Files uploaded via share link carry _shareFolderName from the backend enrichment
        if (file._shareFolderName) {
          groupName = file._shareFolderName;
        } else {
          const user = users.find((u: any) => u._id?.toString() === file.userId?.toString());
          groupName = user?.name || file.userId;
        }

        if (file.orderId) {
          orderIdStr = file.orderId;
        } else {
          // fallback to see if we can find an order matching this file's userId
          const order = orders.find((o: any) => o.userId?.toString() === file.userId?.toString());
          if (order) orderIdStr = order._id;
        }
      }
      
      const isTaskFile = file.category === 'TASK' && file.taskId;

      // Only apply order-status exclusion for non-TASK files
      // Task files are already handled by task status above — don't double-exclude them
      // just because the linked order moved to IN_PRODUCTION/SHIPPED etc.
      if (!isTaskFile && orderIdStr) {
          const order = orders.find((o: any) => o._id === orderIdStr);
          if (order && ((order as any).orderStatus === 'IN_PRODUCTION' || (order as any).orderStatus === 'SHIPPED' || (order as any).orderStatus === 'DELIVERED' || (order as any).orderStatus === 'CANCELLED' || (order as any).orderStatus === 'FAILED')) {
              shouldExclude = true;
          }
      }
      
      if (shouldExclude) return;

      const key = JSON.stringify({ name: groupName, orderId: orderIdStr, taskId: taskIdStr });
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });

    // explicitly add empty folders for any Tasks that don't have files yet
    tasks.forEach((task: any) => {
      if (task.status !== 'IN_PRODUCTION' && task.status !== 'CANCELLED' && task.status !== 'FAILED') {
        if (activeTab !== "ALL" && task.category !== activeTab) return; // respect active tab for empty folders
        const key = JSON.stringify({ name: task.title, orderId: task.orderId || "", taskId: task._id });
        if (!groups[key]) {
          groups[key] = [];
        }
      }
    });

    return Object.entries(groups).map(([keyStr, files]) => {
      const parsed = JSON.parse(keyStr);
      return {
        folderName: parsed.name,
        orderId: parsed.orderId,
        taskId: parsed.taskId,
        userId: files.length > 0 ? files[0].userId : "",
        files
      };
    });
  }, [filteredFiles, ordersResponse, usersResponse, tasksResponse, activeTab]);

  React.useEffect(() => {
    const folderQuery = searchParams.get("folder");
    if (folderQuery && groupedFiles.length > 0 && !selectedFolder) {
      const match = groupedFiles.find(g => g.folderName === folderQuery);
      if (match) {
        setSelectedFolder(`${match.folderName}-${match.orderId}-${match.taskId}`);
      }
    }
  }, [searchParams, groupedFiles, selectedFolder]);

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

  const handleDownloadAll = async (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading(`Preparing ZIP... (0/${group.files.length})`);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const failed: string[] = [];
      let completedCount = 0;

      for (let i = 0; i < group.files.length; i += 3) {
        const chunk = group.files.slice(i, i + 3);
        await Promise.all(chunk.map(async (file: any) => {
          let baseName = file.originalName || "file";
          let fileName = baseName;
          let counter = 1;
          while (usedNames.has(fileName)) {
            const nameParts = baseName.split('.');
            if (nameParts.length > 1) {
              const ext = nameParts.pop();
              fileName = `${nameParts.join('.')}(${counter}).${ext}`;
            } else {
              fileName = `${baseName}(${counter})`;
            }
            counter++;
          }
          usedNames.add(fileName);

          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
          const proxyUrl = `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(getFileUrl(file.path))}&name=${encodeURIComponent(file.originalName || "file")}`;
          try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
              failed.push(baseName);
              return;
            }
            const blob = await response.blob();
            if (blob.size === 0) {
              failed.push(baseName);
              return;
            }
            zip.file(fileName, blob);
          } catch {
            failed.push(baseName);
          } finally {
            completedCount++;
            toast.loading(`Preparing ZIP... (${completedCount}/${group.files.length})`, { id: toastId });
          }
        }));
      }

      toast.loading("Zipping files...", { id: toastId });
      if (Object.keys(zip.files).length === 0) {
        throw new Error("Could not download any files");
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${group.folderName || "artworks"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.dismiss();
      if (failed.length) {
        toast.warning(`Downloaded with ${failed.length} file(s) skipped (failed to fetch)`);
      } else {
        toast.success("Download started!");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to create ZIP");
    }
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
    if (!uploadFiles || uploadFiles.length === 0) return toast.error("Please select a file");

    try {
      const token = session?.user?.token || localStorage.getItem('token') || ""; 
      
      const uploadPromises = Array.from(uploadFiles).map(async (f) => {
        // 1. Direct S3 Upload
        const uploadedData = await uploadToS3Directly(token, f);
        
        // 2. Save Metadata
        const metadata = {
          userId: uploadData.userId || undefined,
          orderId: uploadData.orderId || undefined,
          taskId: uploadData.taskId || undefined,
          folderId: uploadData.folderId || undefined,
          category: uploadData.category,
          notes: uploadData.notes,
          files: [uploadedData]
        };

        const res = await AxiosInstance(token).post("/api/files/save-metadata", metadata);
        return res.data;
      });

      await Promise.all(uploadPromises);
      toast.success("Artwork uploaded successfully");
      setUploadModalOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to upload artwork");
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

  const handleCopyLink = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    const shareLink = `${window.location.origin}/share/file/${file._id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied to clipboard");
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
            <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(getFileUrl(file.path), "_blank"); }} className="gap-1 shadow-sm">
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
          <iframe 
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/files/proxy-download?url=${encodeURIComponent(getFileUrl(file.path))}&name=${encodeURIComponent(file.originalName || "file")}&inline=true#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
            className="absolute top-0 left-0 border-none overflow-hidden"
            style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', pointerEvents: 'none' }}
            tabIndex={-1}
          />
          <div className="absolute inset-0 z-10 bg-transparent"></div>
        </div>
      );
    }

    return (
      <div className="w-full h-24 bg-muted/50 rounded-t-lg flex items-center justify-center">
        {getFileIcon(file.mimetype)}
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

  if (isPending) return <div className="flex justify-center p-8"><p>Loading artworks...</p></div>;

  return (
    <div className="space-y-6">
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
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
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
                  <Input type="file" multiple onChange={e => setUploadFiles(e.target.files)} />
                </div>
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea placeholder="Internal notes..." value={uploadData.notes} onChange={e => setUploadData({ ...uploadData, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUploadSubmit}>Upload</Button>
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

      {groupedFiles.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
          No artwork for now to view.
        </div>
      ) : selectedFolder ? (
        // --- INSIDE A FOLDER ---
        <div className="space-y-4">
          {(() => {
            const activeGroup = groupedFiles.find(g => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
            if (!activeGroup) {
              setTimeout(() => setSelectedFolder(null), 0);
              return null;
            }
            
            const groupFolders = virtualFolders.filter((f: any) => 
              activeGroup.taskId ? f.taskId === activeGroup.taskId : f.userId === activeGroup.userId
            );
            const visibleFiles = activeGroup.files.filter((f: any) => 
              activeSubFolderId ? f.folderId === activeSubFolderId : (!f.folderId || f.folderId === 'null')
            );
            const currentFolder = activeSubFolderId ? groupFolders.find(f => f._id === activeSubFolderId) : null;
            const visibleFolders = activeSubFolderId ? [] : groupFolders;

            return (
              <div 
                className={`relative transition-colors rounded-xl ${isDragOverFolder ? 'bg-primary/5 border border-primary border-dashed p-4' : ''}`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverFolder(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverFolder(true); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverFolder(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);
                    const token = (session as any)?.user?.token || localStorage.getItem('token') || "";
                    
                    const uploadPromises = files.map(async (f) => {
                      // 1. Direct S3 Upload
                      const uploadedData = await uploadToS3Directly(token, f);
                      
                      // 2. Save Metadata
                      const metadata = {
                        userId: activeGroup.userId || undefined,
                        orderId: activeGroup.orderId || undefined,
                        taskId: activeGroup.taskId || undefined,
                        folderId: activeSubFolderId || undefined,
                        category: activeTab !== "ALL" ? activeTab : "DIGITAL PRINTING",
                        files: [uploadedData]
                      };

                      const res = await AxiosInstance(token).post("/api/files/save-metadata", metadata);
                      return res.data;
                    });

                    toast.promise(Promise.all(uploadPromises), {
                      loading: `Uploading ${files.length} files...`,
                      success: () => {
                        refetch();
                        return 'Files uploaded successfully';
                      },
                      error: 'Failed to upload files'
                    });
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
                            onClick={async () => {
                                try {
                                  const res = await createShareLink({
                                    folderName: activeSubFolderId ? `${activeGroup.folderName} / ${virtualFolders.find((f: any) => f._id === activeSubFolderId)?.name || activeGroup.folderName}` : activeGroup.folderName,
                                    taskId: activeGroup.taskId || undefined,
                                    orderId: activeGroup.orderId || undefined,
                                    userId: activeGroup.userId || undefined,
                                    folderId: activeSubFolderId || undefined,
                                  });
                                  const slug = res?.data?.slug;
                                  if (!slug) {
                                    toast.error("Failed to generate share link");
                                    return;
                                  }
                                  const link = `${window.location.origin}/share/${slug}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Share link copied to clipboard");
                                } catch (e) {
                                  toast.error("Failed to generate share link");
                                }
                            }}
                          >
                          <Folder className="w-4 h-4 mr-2" /> {isGeneratingLink ? "Generating..." : "Share Link"}
                        </Button>
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
                                <Card key={folder._id} className="overflow-hidden shadow-sm hover:shadow-md cursor-pointer relative bg-card hover:bg-accent/50 border-primary/20 flex flex-col h-full min-h-[250px]" onClick={() => setActiveSubFolderId(folder._id)}>
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
                                <div key={folder._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 cursor-pointer" onClick={() => setActiveSubFolderId(folder._id)}>
                                  <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <Folder className="w-8 h-8 text-primary/70" fill="currentColor" />
                                    <span className="text-sm font-medium">{folder.name}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); if(confirm('Delete folder and ALL files inside it? This cannot be undone.')) deleteFolderMutate(folder._id); }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            ))}
                            {visibleFiles.map((file: any) => (
                    viewMode === "grid" ? (
                      <Card key={file._id} className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${selectedFiles.includes(file._id) ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                        <div className="absolute top-2 left-2 z-30">
                          <Checkbox 
                            checked={selectedFiles.includes(file._id)} 
                            onCheckedChange={() => handleSelectFile(file._id)} 
                            className="bg-white/80 data-[state=checked]:bg-primary"
                          />
                        </div>
                        {getFileThumbnail(file)}
                        {file.tag === 'draft' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Draft</div>
                        ) : file.tag === 'for_print' ? (
                          <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">For Print</div>
                        ) : file.tag === 'attachment' ? (
                          <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Attachment</div>
                        ) : null}
                        <div className={`absolute right-2 z-30 ${file.tag ? 'top-6' : 'top-2'}`}>
                          <Button variant="secondary" size="icon" className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-all hover:scale-105" onClick={(e) => handleCopyLink(e, file)} title="Copy Share Link">
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
                      <div key={file._id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${selectedFiles.includes(file._id) ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30'}`}>
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
                          <Button variant="ghost" size="icon" onClick={() => window.open(getFileUrl(file.path), "_blank")} title="View">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-blue-50" onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          forceDownload(getFileUrl(file.path), file.originalName);
                        }} title="Download">
                          <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="default" size="icon" onClick={(e) => handleCopyLink(e, file)} title="Copy Share Link">
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
        // --- OUTSIDE (FOLDERS) ---
        <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" : "flex flex-col gap-3"}>
          {groupedFiles.map((group) => {
            const folderId = `${group.folderName}-${group.orderId}-${group.taskId}`;
            if (viewMode === "grid") {
              return (
                <Card 
                  key={folderId} 
                  className="cursor-pointer overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all group relative" 
                  onClick={() => setSelectedFolder(folderId)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-50 hover:text-blue-600"
                    onClick={(e) => handleDownloadAll(group, e)}
                    disabled={group.files.length === 0}
                    title="Download All Files"
                  >
                    <Download className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => handleDeleteFolder(group, e)}
                    disabled={isBulkDeleting}
                    title="Delete Folder and All Files"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                  </Button>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                    {getFolderPreview(group)}
                    <div className="w-full">
                      <h3 className="font-semibold text-base truncate" title={group.folderName}>{group.folderName}</h3>
                      {group.orderId && (
                        <p className="text-[12.8px] font-bold text-foreground/80 mt-1">
                          Order: {group.orderId}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{group.files.length} item(s)</p>
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              return (
                <div 
                  key={folderId} 
                  className="flex items-center gap-4 p-4 border bg-card rounded-lg hover:bg-muted/30 cursor-pointer transition-colors" 
                  onClick={() => setSelectedFolder(folderId)}
                >
                  {getFolderPreview(group, "w-11 h-11 rounded-lg")}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-base truncate">{group.folderName}</span>
                    {group.orderId && <span className="text-[12.8px] font-bold text-foreground/80 truncate">Order ID: {group.orderId}</span>}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{group.files.length} file(s)</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 ml-1"
                      onClick={(e) => handleDownloadAll(group, e)}
                      disabled={group.files.length === 0}
                      title="Download All Files"
                    >
                      <Download className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 ml-1"
                      onClick={(e) => handleDeleteFolder(group, e)}
                      disabled={isBulkDeleting}
                      title="Delete Folder and All Files"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            }
          })}
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
                const activeGroup = groupedFiles.find((g: any) => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
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

      {/* Move to Folder Modal */}
      <Dialog open={moveToFolderModalOpen} onOpenChange={setMoveToFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.length} item(s)</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {(() => {
              const activeGroup = groupedFiles.find((g: any) => `${g.folderName}-${g.orderId}-${g.taskId}` === selectedFolder);
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
    </div>
  );
}

