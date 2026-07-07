/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useMemo } from "react";
import { useAllFiles, useReviewFile, useDeleteFile, useBulkDeleteFiles } from "@/hooks/useAdminDashboard";
import JSZip from "jszip";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrder";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, Download, Eye, CircleCheck, Trash2, Search, X, MessageSquare, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from "lucide-react";
import { forceDownload } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageNext from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
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

// Packaging only ever deals with one status, so there are no sub-tabs (unlike Production's Printing/Hold/Done Printing)
const PACKAGING_STATUS = "PACKAGING";

export default function PackagingManager() {
  const { data: session } = useSession();
  const { data: response, isPending, refetch, isFetching } = useAllFiles();
  const { data: ordersResponse } = useOrders();
  const { data: tasksResponse } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { data: usersResponse } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  // Fixed sub-tab — Packaging has no Printing/Hold/Done Printing tabs like Production does
  const activeSubTab = PACKAGING_STATUS;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteFiles();

  const { mutate: updateOrderStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

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
    const packagingOrders = orders.filter((o: any) => o.orderStatus === PACKAGING_STATUS);
    const packagingOrderIds = packagingOrders.map((o: any) => o._id.toString());
    const users = (usersResponse as any)?.data || [];
    const tasks = (tasksResponse as any)?.tasks || [];
    const packagingTasks = tasks.filter((t: any) => t.status === activeSubTab);
    const packagingTaskIds = packagingTasks.map((t: any) => t._id.toString());
    
    const filteredPackagingOrders = orders.filter((o: any) => o.orderStatus === activeSubTab);
    const packagingOrderIdsFiltered = filteredPackagingOrders.map((o: any) => o._id.toString());
    const packagingUserIds = filteredPackagingOrders.map((o: any) => o.userId?.toString());

    const groups: Record<string, any[]> = {};
    filteredFiles.forEach((file: any) => {
      let groupName = "Unassigned";
      let orderIdStr = "";
      let taskIdStr = "";
      let isTask = false;
      
      const isTaskFile = file.category === 'TASK' && !!file.taskId;
      const isPackagingTask = isTaskFile && packagingTaskIds.includes(file.taskId?.toString());
      const isPackagingOrder = !isTaskFile && (packagingOrderIdsFiltered.includes(file.orderId?.toString()) || packagingUserIds.includes(file.userId?.toString()));
      
      if (!isPackagingOrder && !isPackagingTask) return;

      if (isPackagingTask) {
        const task = tasks.find((t: any) => t._id === file.taskId);
        groupName = task?.title || "Deleted Task";
        taskIdStr = file.taskId;
        orderIdStr = task?.orderId || "";
        isTask = true;
      } else {
        const user = users.find((u: any) => u._id?.toString() === file.userId?.toString());
        groupName = user?.name || file.userId;
        if (file.orderId) {
           orderIdStr = file.orderId;
        } else {
           const order = orders.find((o: any) => o.userId?.toString() === file.userId?.toString() && o.orderStatus === activeSubTab);
           if (order) orderIdStr = order._id;
        }
      }

      const key = JSON.stringify({ name: groupName, orderId: orderIdStr, taskId: taskIdStr, isTask });
      if (!groups[key]) groups[key] = [];
      groups[key].push(file);
    });

    packagingTasks.forEach((task: any) => {
      if (activeTab !== "ALL" && task.category !== activeTab) return; // respect active tab for empty folders
      const key = JSON.stringify({ name: task.title, orderId: task.orderId || "", taskId: task._id, isTask: true });
      if (!groups[key]) {
        groups[key] = [];
      }
    });

    return Object.entries(groups).map(([keyStr, files]) => {
      const parsed = JSON.parse(keyStr);
      let orderStatus = "N/A";
      if (!parsed.isTask && parsed.orderId) {
        const order = orders.find((o: any) => o._id === parsed.orderId);
        if (order) orderStatus = order.orderStatus;
      } else if (parsed.isTask) {
         const task = tasks.find((t: any) => t._id === parsed.taskId);
         orderStatus = task?.status || activeSubTab;
      }
      return {
        folderName: parsed.name,
        orderId: parsed.orderId,
        taskId: parsed.taskId,
        isTask: parsed.isTask, userId: files.length > 0 ? files[0].userId : "",
        orderStatus: orderStatus,
        files
      };
    });
  }, [filteredFiles, ordersResponse, usersResponse, tasksResponse, activeTab, activeSubTab]);

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
    toast.loading(`Preparing ZIP with ${group.files.length} files...`);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const failed: string[] = [];

      const filePromises = group.files.map(async (file: any) => {
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
        const proxyUrl = `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(getFileUrl(file.path))}&name=${encodeURIComponent(file.originalName || "file")}&stream=true`;
        try {
          const response = await fetch(proxyUrl);
          // Without this check, a failed fetch (403/404/502) still resolves
          // and its error body gets added to the zip as if it were the real
          // file — producing an archive that looks fine but only contains
          // broken/unopenable "files". Skip it instead so the ZIP only ever
          // contains real file content.
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
        }
      });
      await Promise.all(filePromises);

      if (Object.keys(zip.files).length === 0) {
        throw new Error("Could not download any files");
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${group.folderName || "packaging"}.zip`;
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

  const handleAdvanceFlow = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Packaging has just one stage, so the tick always moves the item on to Shipped
    handleStatusChange(group, "SHIPPED");
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
            category: uploadData.category || "DIGITAL PRINTING",
            notes: uploadData.notes || undefined,
            files: [uploadedData]
          };

          const res = await AxiosInstance(token).post("/api/files/save-metadata", metadata);
          return res.data;
        });

        await Promise.all(uploadPromises);

        toast.success("Artwork uploaded successfully");
        setUploadModalOpen(false);
        window.location.reload();
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

  const getFileThumbnail = (file: any) => {
    const isImage = file.mimetype?.includes("image") || (file.originalName && file.originalName.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i));
    const isPdf = file.mimetype?.includes("pdf") || (file.originalName && file.originalName.toLowerCase().endsWith(".pdf"));

    if (isImage) {
      return (
        <div className="w-full h-24 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center relative group/thumb">
          <ImageNext 
            src={getFileUrl(file.path)} 
            alt={file.originalName} 
            width={96}
            height={96}
            quality={60}
            className="object-cover w-full h-full absolute inset-0 z-0 transition-transform group-hover/thumb:scale-105" 
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
            src={`${getFileUrl(file.path)}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
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
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
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
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start mb-2">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {groupedFiles.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
          No files in packaging right now.
        </div>
      ) : selectedFolder ? (
        // --- INSIDE A FOLDER ---
        <div className="space-y-4">
          {(() => {
            const activeGroup = groupedFiles.find(g => `${g.folderName}-${g.orderId}-${g.taskId || ""}` === selectedFolder);
            if (!activeGroup) {
              setTimeout(() => setSelectedFolder(null), 0);
              return null;
            }
            return (
              <>
                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Folder className="w-5 h-5 text-primary" />
                      {activeGroup.folderName}
                    </h2>
                    {(activeGroup.orderId || activeGroup.taskId) && (
                      <p className="text-[14.4px] font-bold text-foreground/80">
                        {activeGroup.taskId ? `Task ID: ${activeGroup.taskId}` : `Order ID: ${activeGroup.orderId}`}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-semibold">Change Status:</span>
                      <select 
                        className="h-8 text-xs bg-background border border-border/50 rounded px-2 focus:ring-0"
                        value={activeGroup.orderStatus}
                        onChange={(e) => handleStatusChange(activeGroup, e.target.value)}
                        disabled={isUpdatingStatus}
                      >
                        {['PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button variant="secondary" size="sm" onClick={(e) => handleDownloadAll(activeGroup, e)}>
                      <Download className="w-4 h-4 mr-2" /> Download All
                    </Button>
                  </div>
                </div>
                
                <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" : "flex flex-col gap-3"}>
                  {activeGroup.files.map((file: any) => (
                    viewMode === "grid" ? (
                      <Card key={file._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                        {getFileThumbnail(file)}
                        {file.tag === 'draft' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Draft</div>
                        ) : file.tag === 'for_print' ? (
                          <div className="absolute top-0 right-0 bg-green-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">For Print</div>
                        ) : file.tag === 'attachment' ? (
                          <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-bl-xl shadow-sm tracking-wide z-10 uppercase">Attachment</div>
                        ) : null}
                        <CardHeader className="p-4 pb-2 flex flex-col items-start justify-between bg-muted/5 border-b">
                          <div className="overflow-hidden w-full">
                            <CardTitle className="text-[10px] truncate w-full flex items-center gap-2" title={file.originalName}>
                              {file.originalName}
                              
                            </CardTitle>
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
                              <span>{file.adminNotes}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2 mt-2">
                            <Button variant="secondary" size="lg" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 py-6 text-sm font-semibold" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              forceDownload(getFileUrl(file.path), file.originalName);
                            }}>
                              <Download className="w-5 h-5 mr-2" /> Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div key={file._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {getFileIcon(file.mimetype)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate" title={file.originalName}>{file.originalName}</h4>
                              
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="bg-muted px-1.5 py-0.5 rounded">{file.category || "Uncategorized"}</span>
                              <span className={file.adminReviewed ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
                                {file.adminReviewed ? "Reviewed" : "Pending"}
                              </span>
                              {file.adminNotes && (
                                <span className="flex items-center gap-1 text-primary truncate">
                                  <MessageSquare className="w-3 h-3" /> {file.adminNotes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Button variant="ghost" size="icon" className="hover:bg-blue-50 h-10 w-10" onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            forceDownload(getFileUrl(file.path), file.originalName);
                          }} title="Download">
                            <Download className="w-5 h-5 text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        // --- OUTSIDE (FOLDERS) ---
        <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" : "flex flex-col gap-3"}>
          {groupedFiles.map((group) => {
            const folderId = `${group.folderName}-${group.orderId}-${group.taskId || ""}`;
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
                      <button type="button" onClick={(e) => handleAdvanceFlow(group, e)} className="absolute top-2 left-2 z-10 text-muted-foreground hover:text-emerald-500 transition-colors" title="Mark as Shipped">
                        <CheckCircle className="w-6 h-6 bg-background rounded-full" />
                      </button>
                      <h3 className="font-semibold text-base truncate" title={group.folderName}>{group.folderName}</h3>
                      {group.orderId && (
                        <p className="text-[12.8px] font-bold text-foreground/80 mt-1 mb-2">
                          Order: {group.orderId}
                        </p>
                      )}
                      {group.orderId && (
                        <select 
                          className="h-7 w-full text-xs bg-background border border-border/50 rounded px-2 focus:ring-0"
                          value={group.orderStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateOrderStatus({ id: group.orderId, status: e.target.value }, {
                            onSuccess: () => toast.success("Order status updated!"),
                            onError: () => toast.error("Failed to update order status")
                          })}
                          disabled={isUpdatingStatus}
                        >
                          {['PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 font-medium">{group.files.length} item(s)</p>
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
                  <div className="rounded-lg shrink-0 relative overflow-hidden w-11 h-11 bg-primary/10 flex items-center justify-center">
                    <button type="button" onClick={(e) => handleAdvanceFlow(group, e)} className="absolute -top-1 -left-1 z-10 text-muted-foreground hover:text-emerald-500 transition-colors" title="Mark as Shipped">
                      <CheckCircle className="w-6 h-6 bg-background rounded-full" />
                    </button>
                    {getFolderPreview(group, "w-11 h-11")}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-base truncate">{group.folderName}</span>
                    {group.orderId && <span className="text-[12.8px] font-bold text-foreground/80 truncate">Order ID: {group.orderId}</span>}
                  </div>
                  {group.orderId && (
                    <div className="shrink-0 mr-4" onClick={(e) => e.stopPropagation()}>
                        <select 
                          className="h-8 text-xs bg-background border border-border/50 rounded px-2 focus:ring-0"
                          value={group.orderStatus}
                          onChange={(e) => updateOrderStatus({ id: group.orderId, status: e.target.value }, {
                            onSuccess: () => toast.success("Order status updated!"),
                            onError: () => toast.error("Failed to update order status")
                          })}
                          disabled={isUpdatingStatus}
                        >
                          {['PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                    </div>
                  )}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{group.files.length} file(s)</span>
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
    </div>
  );
}
