/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Folder, FileText, Eye, Loader2, Upload, Download, Trash2, StickyNote, X, Check, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle/theme-toggle";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function PublicSlugFolderView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [noteState, setNoteState] = useState<Record<string, { open: boolean; value: string; saving: boolean }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/files/s/${slug}`);
      const data = await res.json();
      if (data?.success) {
        setFiles(data.data || []);
        if (data.folderName) setFolderName(data.folderName);
        else setNotFound(true);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [slug]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading("Uploading files...");
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // 1. Get presigned URL
        const urlRes = await fetch(`${BACKEND}/api/files/s/${slug}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        
        if (!urlRes.ok) throw new Error("Gagal mendapatkan link muat naik");
        const { url, key, publicUrl, userId, taskId, orderId, folderId, shareCategory } = await urlRes.json();
        
        // 2. Upload directly to S3
        const s3Res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });
        
        if (!s3Res.ok) throw new Error("Gagal memuat naik fail ke S3");
        
        uploadedFiles.push({
          key,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          path: publicUrl
        });
      }

      // 3. Save metadata
      const metaRes = await fetch(`${BACKEND}/api/files/s/${slug}/save-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles })
      });
      
      if (!metaRes.ok) throw new Error("Gagal menyimpan metadata fail");
      // Success is handled below
      toast.success("Files uploaded successfully!", { id: toastId });
      await fetchFiles();
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeletingId(fileId);
    try {
      const res = await fetch(`${BACKEND}/api/files/s/${slug}/files/${fileId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("File deleted");
      setFiles(prev => prev.filter(f => f._id !== fileId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const openNote = (file: any) => {
    setNoteState(prev => ({
      ...prev,
      [file._id]: { open: true, value: file.notes || "", saving: false }
    }));
  };

  const closeNote = (id: string) => {
    setNoteState(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
  };

  const saveNote = async (fileId: string) => {
    const note = noteState[fileId];
    if (!note) return;
    setNoteState(prev => ({ ...prev, [fileId]: { ...prev[fileId], saving: true } }));
    try {
      const res = await fetch(`${BACKEND}/api/files/s/${slug}/files/${fileId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save note");
      toast.success("Note saved");
      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, notes: note.value } : f));
      closeNote(fileId);
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setNoteState(prev => ({ ...prev, [fileId]: { ...prev[fileId], saving: false } }));
    }
  };

  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    const toastId = toast.loading(`Packing files... (0/${files.length})`);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const failed: string[] = [];
      let completedCount = 0;

      for (let i = 0; i < files.length; i += 3) {
        const chunk = files.slice(i, i + 3);
        await Promise.all(
          chunk.map(async (file: any) => {
            try {
              // stream=true is required here: without it the backend just
              // The backend redirects to the S3 URL. Since you fixed the AWS CORS rules, 
              // the browser can now securely download directly from S3 at full speed
              // without bottlenecking your Node.js backend server!
              const proxyUrl = `${BACKEND}/api/files/proxy-download?url=${encodeURIComponent(file.path)}&name=${encodeURIComponent(file.originalName || "file")}`;
              const res = await fetch(proxyUrl);
              if (!res.ok) {
                failed.push(file.originalName || "file");
                return;
              }
              const blob = await res.blob();
              if (blob.size === 0) {
                failed.push(file.originalName || "file");
                return;
              }

              // Avoid silently overwriting same-named files inside the zip
              let name = file.originalName || "file";
              let counter = 1;
              while (usedNames.has(name)) {
                const parts = (file.originalName || "file").split(".");
                const ext = parts.length > 1 ? `.${parts.pop()}` : "";
                name = `${parts.join(".")}(${counter})${ext}`;
                counter++;
              }
              usedNames.add(name);
              zip.file(name, blob);
            } catch (err) {
              failed.push(file.originalName || "file");
            } finally {
              completedCount++;
              toast.loading(`Packing files... (${completedCount}/${files.length})`, { id: toastId });
            }
          })
        );
      }

      toast.loading("Zipping files...", { id: toastId });
      if (Object.keys(zip.files).length === 0) {
        throw new Error("Could not download any files. Please try again.");
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName || "files"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (failed.length) {
        toast.warning(`Downloaded with ${failed.length} file(s) skipped (failed to fetch).`, { id: toastId });
      } else {
        toast.success("Download ready!", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };


  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="p-12 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm max-w-md">
        This link is invalid or has expired.
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 min-h-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="w-7 h-7 text-primary" />
            </div>
            <div>
              {folderName.includes(" / ") ? (
                <>
                  <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-wider uppercase">
                    {folderName.split(" / ")[0]}
                  </div>
                  <h1 className="text-2xl font-bold leading-none">{folderName.split(" / ").slice(1).join(" / ")}</h1>
                </>
              ) : (
                <h1 className="text-xl font-bold">{folderName}</h1>
              )}
              <p className="text-sm text-muted-foreground mt-1">{files.length} file{files.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input
              type="file"
              multiple
              id="upload-artwork"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept="image/*,application/pdf"
            />
            <label htmlFor="upload-artwork" className="w-full sm:w-auto">
              <Button asChild variant="outline" className="w-full sm:w-auto cursor-pointer gap-2" disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading..." : "Upload Artwork"}
                </span>
              </Button>
            </label>
            {files.length > 0 && (
              <Button onClick={handleDownloadAll} disabled={downloading} className="w-full sm:w-auto gap-2">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "Preparing ZIP…" : "Download All"}
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm">
            <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No files yet</p>
            <p className="text-sm mt-1">Upload your artwork files using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {files.map((file) => {
              const isImage = file.mimetype?.startsWith("image/");
              const noteEditor = noteState[file._id];
              return (
                <Card key={file._id} className="overflow-hidden bg-card shadow-sm hover:shadow-md transition-all border group">
                  {/* Preview */}
                  {isImage ? (
                    <div className="h-44 relative bg-muted/50 overflow-hidden flex items-center justify-center group/thumb">
                      <img 
                        src={file.path.startsWith('http') ? file.path : `${BACKEND}/${file.path}`} 
                        alt={file.originalName} 
                        className="w-full h-full object-cover absolute inset-0 z-0 transition-transform group-hover/thumb:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextEl) nextEl.style.display = 'flex';
                        }} 
                      />
                      <div style={{ display: 'none' }} className="w-full h-full items-center justify-center z-10 bg-muted/50">
                        <ImageIcon className="w-10 h-10 text-muted-foreground opacity-40" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <Button variant="secondary" size="sm" onClick={() => window.open(file.path.startsWith('http') ? file.path : `${BACKEND}/${file.path}`, "_blank")} className="gap-1 shadow-sm">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 bg-muted flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-14 h-14 mb-3 opacity-40" />
                      <span className="text-sm">PDF / Document</span>
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    {/* File info */}
                    <div>
                      <p className="font-semibold text-sm truncate" title={file.originalName}>{file.originalName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(file.uploadedAt), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>

                    {/* Existing note display */}
                    {file.notes && !noteEditor?.open && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2 text-xs text-yellow-600 dark:text-yellow-400">
                        <StickyNote className="w-3 h-3 inline mr-1" />
                        {file.notes}
                      </div>
                    )}

                    {/* Note editor */}
                    {noteEditor?.open && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add a note for admin..."
                          value={noteEditor.value}
                          onChange={e => setNoteState(prev => ({ ...prev, [file._id]: { ...prev[file._id], value: e.target.value } }))}
                          className="text-xs min-h-[70px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => saveNote(file._id)} disabled={noteEditor.saving}>
                            {noteEditor.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => closeNote(file._id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t">
                      <Button
                        variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1"
                        onClick={() => window.open(`${BACKEND}/api/files/${file._id}/download`, "_blank")}
                      >
                        <Download className="w-3 h-3" /> Download
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700 dark:hover:text-yellow-400"
                        onClick={() => noteEditor?.open ? closeNote(file._id) : openNote(file)}
                        title="Add note"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => handleDelete(file._id)}
                        disabled={deletingId === file._id}
                        title="Delete file"
                      >
                        {deletingId === file._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
