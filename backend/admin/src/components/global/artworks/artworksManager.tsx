"use client";
import React, { useState, useMemo } from "react";
import { useGroupedFiles, useReviewFile, useDeleteFile } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, FileText, Image as ImageIcon, ArrowLeft, Download, Eye, CheckCircle, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ArtworksManager() {
  const { data: response, isPending } = useGroupedFiles();
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { mutate: reviewFileMutate, isPending: isReviewing } = useReviewFile();
  const { mutate: deleteFileMutate, isPending: isDeleting } = useDeleteFile();

  const groupedData: any[] = response?.data || [];

  // Filter folders by customer name, order ID, or tracking number
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupedData;
    return groupedData.filter((group: any) => {
      const nameMatch = group.user?.name?.toLowerCase().includes(q);
      const idMatch = group.user?._id?.toString().toLowerCase().includes(q);
      // Check short ID (last 6 chars, uppercase — matches how artworksManager displays it)
      const shortIdMatch = group.user?._id?.toString().slice(-6).toLowerCase().includes(q);
      // Check order IDs across all files in this folder
      const orderMatch = group.files?.some((f: any) =>
        f.orderId?.toString().toLowerCase().includes(q) ||
        f.orderId?.toString().slice(-6).toLowerCase().includes(q)
      );
      // Check tracking numbers across all files
      const trackingMatch = group.files?.some((f: any) =>
        f.trackingNumber?.toLowerCase().includes(q)
      );
      return nameMatch || idMatch || shortIdMatch || orderMatch || trackingMatch;
    });
  }, [groupedData, searchQuery]);

  const handleReview = (fileId: string, currentStatus: boolean) => {
    reviewFileMutate(
      { id: fileId, reviewed: !currentStatus },
      {
        onSuccess: () => {
          toast.success("File review status updated!");
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

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimetype.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (isPending) return <div className="flex justify-center p-8"><p>Loading artworks...</p></div>;

  // ── Folder detail view ──────────────────────────────────────────────────
  if (selectedFolder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedFolder(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Folders
          </Button>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Folder className="w-6 h-6 text-yellow-500" />
            {selectedFolder.user?.name || "Unknown Customer"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedFolder.files.map((file: any) => (
            <Card key={file._id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimetype)}
                  <div>
                    <CardTitle className="text-sm truncate w-40" title={file.originalName}>
                      {file.originalName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(new Date(file.uploadedAt), "dd MMM yyyy, HH:mm")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex flex-col gap-3">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className={file.adminReviewed ? "text-green-500 font-semibold" : "text-amber-500"}>
                    {file.adminReviewed ? "Reviewed" : "Pending Review"}
                  </span>
                </div>
                {file.notes && (
                  <div className="text-xs bg-muted p-2 rounded-md italic">
                    "{file.notes}"
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(file.path, "_blank")}>
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(file.path, "_blank")}>
                    <Download className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button
                    variant={file.adminReviewed ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleReview(file._id, file.adminReviewed)}
                    disabled={isReviewing}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {file.adminReviewed ? "Mark Unreviewed" : "Mark as Reviewed"}
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(file._id)} disabled={isDeleting}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Folder grid view with search bar ───────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, order ID, or tracking number…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count when filtering */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredData.length === 0
            ? "No results found."
            : `Showing ${filteredData.length} of ${groupedData.length} customer${groupedData.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Folder grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredData.length === 0 && !searchQuery ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No artworks found.
          </div>
        ) : (
          filteredData.map((group: any) => (
            <Card
              key={group._id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedFolder(group)}
            >
              <CardHeader className="p-4 flex flex-col items-center justify-center space-y-2">
                <Folder className="w-16 h-16 text-yellow-500 fill-yellow-100" />
                <CardTitle className="text-base text-center truncate w-full">
                  {group.user?.name || "Unknown Customer"}
                </CardTitle>
                {group.user?._id && (
                  <div className="text-xs text-muted-foreground truncate w-full text-center">
                    ID: {group.user._id.toString().slice(-6).toUpperCase()}
                  </div>
                )}
                <CardDescription>
                  {group.count} file{group.count !== 1 && "s"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
