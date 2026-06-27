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
      const formData = new FormData();
      Array.from(e.target.files).forEach(f => formData.append("files", f));
      const res = await fetch(`${BACKEND}/api/files/s/${slug}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
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

  const handleDownloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = `${BACKEND}/api/files/${file._id}/download`;
        a.download = file.originalName || "file";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 300);
    });
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="p-12 text-center text-muted-foreground bg-white border border-dashed rounded-xl shadow-sm max-w-md">
        This link is invalid or has expired.
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 min-h-full pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{folderName}</h1>
              <p className="text-sm text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}</p>
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
              <Button onClick={handleDownloadAll} className="w-full sm:w-auto gap-2">
                <Download className="w-4 h-4" /> Download All
              </Button>
            )}
          </div>
        </div>

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground bg-white border border-dashed rounded-xl shadow-sm">
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
                <Card key={file._id} className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-all border group">
                  {/* Preview */}
                  {isImage ? (
                    <div className="h-44 relative bg-muted/50 overflow-hidden flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-blue-400 opacity-50 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" onClick={() => window.open(file.path, "_blank")} className="gap-1">
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
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-800">
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
                        variant="outline" size="sm" className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                        onClick={() => noteEditor?.open ? closeNote(file._id) : openNote(file)}
                        title="Add note"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
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
