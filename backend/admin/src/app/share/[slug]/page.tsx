/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Folder, FileText, Eye, Loader2, Upload, Download, Trash2, StickyNote, X, Check, Image as ImageIcon, CloudUpload
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle/theme-toggle";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export default function PublicSlugFolderView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState<Array<{ _id: string; name: string }>>([]);
  const [audience, setAudience] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<"not-found" | "service" | null>(null);
  const [noteState, setNoteState] = useState<Record<string, { open: boolean; value: string; saving: boolean }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploadStats, setUploadStats] = useState({ current: 0, total: 0 });
  const publicApiFetch = (url: string, init?: RequestInit) =>
    fetch(url, { ...init, credentials: "omit" });
  const fileContentUrl = (fileId: string, download = false) =>
    `${BACKEND}/api/files/s/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}/content${download ? "?download=true" : ""}`;

  const fetchFiles = async () => {
    try {
      setLoadError(null);
      const res = await publicApiFetch(`${BACKEND}/api/files/s/${slug}`);
      const data = await res.json().catch(() => null);
      if (res.status === 404) {
        setLoadError("not-found");
      } else if (!res.ok || !data) {
        setLoadError("service");
      } else if (data.success && data.folderName) {
        setFiles(data.data || []);
        setFolders(data.folders || []);
        setAudience(data.audience === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER");
        setFolderName(data.folderName);
      } else {
        setLoadError("not-found");
      }
    } catch {
      setLoadError("service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [slug]);

  // When the share has per-item folders, open the first folder that actually
  // has files so the customer/supplier sees files grouped by item right away
  // instead of a flat dump of every picture.
  useEffect(() => {
    if (folders.length > 0 && !activeFolderId) {
      const firstWithFiles = folders.find((folder) =>
        files.some((file) => file.folderId === folder._id)
      );
      if (firstWithFiles) setActiveFolderId(firstWithFiles._id);
    }
  }, [folders, files]);

  const visibleFiles = activeFolderId
    ? files.filter((file) => file.folderId === activeFolderId)
    : files;
  const folderNameOf = (file: any) => folders.find((folder) => folder._id === file.folderId)?.name;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.map(file => file.name).join(", ")} exceeded the 200MB limit.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    setUploadStats({ current: 0, total: selectedFiles.length });
    const toastId = toast.loading(`Uploading files (0/${selectedFiles.length})...`);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        toast.loading(`Uploading files (${i + 1}/${selectedFiles.length})...`, { id: toastId });
        setUploadStats({ current: i + 1, total: selectedFiles.length });
        const file = selectedFiles[i];
        
        // 1. Get presigned URL
        const urlRes = await publicApiFetch(`${BACKEND}/api/files/s/${slug}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, folderId: activeFolderId })
        });
        
        const urlData = await urlRes.json().catch(() => null);
        if (!urlRes.ok || !urlData?.url) throw new Error(urlData?.message || "Failed to get upload link");
        const { url, key, publicUrl } = urlData;
        
        // 2. Upload directly to S3
        const s3Res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });
        
        if (!s3Res.ok) throw new Error("Gagal memuat naik fail ke S3");
        
        const fileData = {
          key,
          originalName: file.name,
          mimetype: file.type || "application/octet-stream",
          size: file.size,
          path: publicUrl
        };

        // 3. Save metadata immediately
        const metaRes = await publicApiFetch(`${BACKEND}/api/files/s/${slug}/save-metadata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: [fileData], folderId: activeFolderId })
        });
        
        const metaData = await metaRes.json().catch(() => null);
        if (!metaRes.ok || !metaData?.success) throw new Error(metaData?.message || "Failed to save file metadata");
      }

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
      const res = await publicApiFetch(`${BACKEND}/api/files/s/${slug}/files/${fileId}`, { method: "DELETE" });
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
      const res = await publicApiFetch(`${BACKEND}/api/files/s/${slug}/files/${fileId}/note`, {
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
    const downloadId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const toastId = toast.loading("Preparing your download...");

    // Poll the backend every 500ms for real-time file-count progress while
    // the actual ZIP streams in the separate fetch below.
    const pollInterval = setInterval(async () => {
      try {
        const progRes = await publicApiFetch(`${BACKEND}/api/files/download-progress/${downloadId}`);
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
      // Stream the ZIP directly from the backend instead of building it in
      // the browser with JSZip — client-side zipping pulled every file's
      // full bytes into browser memory before assembling the archive,
      // which crashed with "array buffer allocation failed" on folders
      // with many or large files. The backend already streams safely.
      const downloadUrl = `${BACKEND}/api/files/s/${slug}/download-all?downloadId=${downloadId}`;
      const res = await publicApiFetch(downloadUrl);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Could not download files. Please try again.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName || "files"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const skippedHeader = res.headers.get("X-Skipped-Files");
      if (skippedHeader && Number(skippedHeader) > 0) {
        toast.warning(`Downloaded with ${skippedHeader} file(s) skipped (failed to fetch).`, { id: toastId });
      } else {
        toast.success("Download ready!", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed", { id: toastId });
    } finally {
      clearInterval(pollInterval);
      setDownloading(false);
    }
  };


  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="p-12 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm max-w-md">
        {loadError === "not-found"
          ? "This share link was not found. Please ask the sender to generate a new link."
          : "The file service is temporarily unavailable. Please try again shortly."}
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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${audience === "SUPPLIER" ? "bg-lime-500/15 text-lime-700 dark:text-lime-300" : "bg-blue-500/15 text-blue-700 dark:text-blue-300"}`}>
                  {audience} VIEW
                </span>
              </div>
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

        {folders.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="font-semibold">{audience === "SUPPLIER" ? "Production folders" : "Item folders"}</h2>
              <p className="text-sm text-muted-foreground">{audience === "SUPPLIER" ? "Click a folder to filter to its For Print files." : "Click a folder to open that item's files."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder) => {
                const count = files.filter((file) => file.folderId === folder._id).length;
                const isActive = activeFolderId === folder._id;
                return (
                  <button key={folder._id} type="button" onClick={() => setActiveFolderId(isActive ? null : folder._id)} className={`flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${isActive ? "border-primary ring-1 ring-primary" : ""}`}>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${audience === "SUPPLIER" ? "bg-lime-500/15 text-lime-700 dark:text-lime-300" : "bg-blue-500/15 text-blue-700 dark:text-blue-300"}`}><Folder className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="truncate font-semibold">{folder.name}</p><p className="text-xs text-muted-foreground">{count} {audience === "SUPPLIER" ? `For Print file${count !== 1 ? "s" : ""}` : `file${count !== 1 ? "s" : ""}`}</p></div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Files Grid */}
        {visibleFiles.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm">
            <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No visible files here</p>
            <p className="text-sm mt-1">
              {activeFolderId
                ? "No files are available in this folder yet."
                : audience === "SUPPLIER"
                  ? "No For Print files are available in this location."
                  : "Only Draft and Attachment files are available to customers."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleFiles.map((file) => {
              const isImage = file.mimetype?.startsWith("image/");
              const noteEditor = noteState[file._id];
              return (
                <Card key={file._id} className="overflow-hidden bg-card shadow-sm hover:shadow-md transition-all border group">
                  {/* Preview */}
                  {isImage ? (
                    <div className="h-44 relative bg-muted/50 overflow-hidden flex items-center justify-center group/thumb">
                      <img 
                        src={fileContentUrl(file._id)}
                        alt={file.originalName} 
                        loading="lazy"
                        decoding="async"
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
                        <Button variant="secondary" size="sm" onClick={() => window.open(fileContentUrl(file._id), "_blank")} className="gap-1 shadow-sm">
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
                      {folderNameOf(file) && (
                        <p className="text-[11px] text-primary font-medium mt-0.5 flex items-center gap-1">
                          <Folder className="w-3 h-3" /> {folderNameOf(file)}
                        </p>
                      )}
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
                        onClick={() => window.open(fileContentUrl(file._id, true), "_blank")}
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
      {uploading && uploadStats.total > 0 && (
        <div className="fixed top-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <div className="relative flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Uploading Files</h3>
            <p className="text-xs text-muted-foreground font-medium">
              File {uploadStats.current} of {uploadStats.total}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
