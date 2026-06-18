"use client";
import React, { useState, useMemo } from "react";
import { useAllFiles, useReviewFile, useDeleteFile } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, Download, Eye, CheckCircle, Trash2, Search, X, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { data: response, isPending } = useAllFiles();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [commentText, setCommentText] = useState("");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ userId: "", orderId: "", category: "DIGITAL PRINTING", notes: "" });
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();

  const allFiles: any[] = response?.data || [];

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
        window.location.reload();
      },
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
      const token = document.cookie.split('; ').find(row => row.startsWith('next-auth.session-token='))?.split('=')[1] 
        || localStorage.getItem('token') || ""; 
        
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success("Artwork uploaded successfully");
      setUploadModalOpen(false);
      window.location.reload();
    } catch (e) {
      toast.error("Failed to upload artwork");
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimetype?.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (isPending) return <div className="flex justify-center p-8"><p>Loading artworks...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full max-w-md">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start mb-6">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredFiles.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-xl">
            No artworks found in this category.
          </div>
        ) : (
          filteredFiles.map((file: any) => (
            <Card key={file._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimetype)}
                  <div className="overflow-hidden">
                    <CardTitle className="text-sm truncate w-40" title={file.originalName}>
                      {file.originalName}
                    </CardTitle>
                    <CardDescription className="text-xs truncate w-40">
                      User: {file.userId?.slice(-6).toUpperCase() || 'N/A'}
                    </CardDescription>
                  </div>
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
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(file.path, "_blank")}>
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    setSelectedFile(file);
                    setCommentText(file.adminNotes || "");
                    setCommentModalOpen(true);
                  }}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Note
                  </Button>

                  <Button
                    variant={file.adminReviewed ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleReview(file._id, file.adminReviewed, file.adminNotes)}
                    disabled={isReviewing}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {file.adminReviewed ? "Unmark Review" : "Mark as Reviewed"}
                  </Button>
                  
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(file._id)} disabled={isDeleting}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
