"use client";
import React, { useState, useMemo } from "react";
import { useAllFiles, useReviewFile, useDeleteFile, useBulkDeleteFiles } from "@/hooks/useAdminDashboard";
import { useOrders } from "@/hooks/useOrder";
import { useUsers } from "@/hooks/useUsers";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, Download, Eye, CircleCheck, Trash2, Search, X, MessageSquare, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";

const categories = [
  "ALL",
  "DIGITAL PRINTING",
  "DISPLAY ITEM",
  "DIGITAL OFFSET",
  "CORPORATE GIFT",
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
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteFiles();

  const allFiles: any[] = (response as any)?.data || [];

  const filteredFiles = useMemo(() => {
    let result = allFiles;
    if (activeTab !== "ALL") {
      result = result.filter(f => f.category === activeTab);
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
    const users = usersResponse?.users || [];
    const tasks = tasksResponse?.tasks || [];
    const groups: Record<string, any[]> = {};
    filteredFiles.forEach((file: any) => {
      let groupName = "Unassigned";
      let orderIdStr = "";
      
      let shouldExclude = false;

      if (file.category === 'TASK' && file.taskId) {
        const task = tasks.find((t: any) => t._id === file.taskId);
        groupName = task ? task.title : "Deleted Task";
        orderIdStr = task?.orderId || "";
        
        if (task && (task.status === 'DONE DESIGN' || task.status === 'CANCELLED' || task.status === 'FAILED')) {
            shouldExclude = true;
        }
      } else {
        const user = users.find((u: any) => u._id?.toString() === file.userId?.toString());
        groupName = user?.name || file.userId;

        if (file.orderId) {
          orderIdStr = file.orderId;
        } else {
          // fallback to see if we can find an order matching this file's userId
          const order = orders.find((o: any) => o.userId?.toString() === file.userId?.toString());
          if (order) orderIdStr = order._id;
        }
      }
      
      if (orderIdStr) {
          const order = orders.find((o: any) => o._id === orderIdStr);
          if (order && (order.orderStatus === 'DONE DESIGN' || order.orderStatus === 'IN_PRODUCTION' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED' || order.orderStatus === 'FAILED')) {
              shouldExclude = true;
          }
      }
      
      if (shouldExclude) return;

      const key = JSON.stringify({ name: groupName, orderId: orderIdStr });
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });

    // explicitly add empty folders for any Tasks that don't have files yet
    tasks.forEach((task: any) => {
      if (task.status !== 'DONE DESIGN' && task.status !== 'CANCELLED' && task.status !== 'FAILED') {
        const key = JSON.stringify({ name: task.title, orderId: task.orderId || "" });
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
        files
      };
    });
  }, [filteredFiles, ordersResponse, usersResponse, tasksResponse]);

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
          toast.success("Comment saved!");
          setCommentModalOpen(false);
          window.location.reload();
        },
      }
    );
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
    if (!uploadData.userId) return toast.error("User ID is required");
    if (!uploadFiles || uploadFiles.length === 0) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("userId", uploadData.userId);
    formData.append("orderId", uploadData.orderId);
    formData.append("category", uploadData.category);
    formData.append("notes", uploadData.notes);
    Array.from(uploadFiles).forEach(f => formData.append("files", f));

      try {
        const token = session?.user?.token || localStorage.getItem('token') || ""; 
          
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/upload`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Upload error response:", errorData);
          throw new Error(errorData.message || "Upload failed");
        }
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
    if (file.mimetype?.includes("image")) {
      return (
        <div className="w-full h-40 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
          <img src={getFileUrl(file.path)} alt={file.originalName} className="object-cover w-full h-full" />
        </div>
      );
    }
    return (
      <div className="w-full h-40 bg-muted/50 rounded-t-lg flex items-center justify-center">
        {getFileIcon(file.mimetype)}
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
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Upload Artwork</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Artwork for User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>User ID / Customer ID *</Label>
                  <Input placeholder="64a1b..." value={uploadData.userId} onChange={e => setUploadData({ ...uploadData, userId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Order ID (Optional)</Label>
                  <Input placeholder="Order ID if applicable" value={uploadData.orderId} onChange={e => setUploadData({ ...uploadData, orderId: e.target.value })} />
                </div>
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
            const activeGroup = groupedFiles.find(g => `${g.folderName}-${g.orderId}` === selectedFolder);
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
                    {activeGroup.orderId && <p className="text-sm text-muted-foreground">Order ID: {activeGroup.orderId}</p>}
                  </div>
                </div>
                
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                  {activeGroup.files.map((file: any) => (
                    viewMode === "grid" ? (
                      <Card key={file._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {getFileThumbnail(file)}
                        <CardHeader className="p-4 pb-2 flex flex-col items-start justify-between bg-muted/5 border-b">
                          <div className="overflow-hidden w-full">
                            <CardTitle className="text-sm truncate w-full" title={file.originalName}>
                              {file.originalName}
                            </CardTitle>
                            <CardDescription className="text-xs truncate w-full">
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
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(getFileUrl(file.path), "_blank")}>
                                <Eye className="w-4 h-4 mr-1" /> View
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                setSelectedFile(file);
                                setCommentText(file.adminNotes || "");
                                setCommentModalOpen(true);
                              }}>
                                <MessageSquare className="w-4 h-4 mr-1" /> Note
                              </Button>
                            </div>
                            <Button variant="secondary" size="sm" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200" onClick={() => {
                              const link = document.createElement("a");
                              link.href = getFileUrl(file.path);
                              link.download = file.originalName;
                              link.target = "_blank";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}>
                              <Download className="w-4 h-4 mr-1" /> Download
                            </Button>
                            <Button
                              variant={file.adminReviewed ? "outline" : "default"}
                              size="sm"
                              className="w-full"
                              onClick={() => handleReview(file._id, file.adminReviewed, file.adminNotes)}
                              disabled={isReviewing}
                            >
                              <CircleCheck className="w-4 h-4 mr-1" />
                              {file.adminReviewed ? "Unmark Review" : "Mark as Reviewed"}
                            </Button>
                            
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(file._id)} disabled={isDeleting}>
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div key={file._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {getFileIcon(file.mimetype)}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium truncate" title={file.originalName}>{file.originalName}</h4>
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
                          <Button variant="ghost" size="icon" onClick={() => window.open(getFileUrl(file.path), "_blank")} title="View">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const link = document.createElement("a");
                            link.href = getFileUrl(file.path);
                            link.download = file.originalName;
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }} title="Download">
                            <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedFile(file);
                            setCommentText(file.adminNotes || "");
                            setCommentModalOpen(true);
                          }} title="Add Note">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant={file.adminReviewed ? "secondary" : "default"} size="icon" onClick={() => handleReview(file._id, file.adminReviewed, file.adminNotes)} title="Toggle Review">
                            <CircleCheck className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(file._id)} disabled={isDeleting} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
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
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
          {groupedFiles.map((group) => {
            const folderId = `${group.folderName}-${group.orderId}`;
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
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <Folder className="w-8 h-8 text-primary" />
                    </div>
                    <div className="w-full">
                      <h3 className="font-semibold text-base truncate" title={group.folderName}>{group.folderName}</h3>
                      {group.orderId && (
                        <p className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block mt-1">
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
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                    <Folder className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-base truncate">{group.folderName}</span>
                    {group.orderId && <span className="text-[10px] text-muted-foreground font-mono truncate">Order ID: {group.orderId}</span>}
                  </div>
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
