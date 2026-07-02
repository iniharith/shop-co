/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, Loader2, File, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle/theme-toggle";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function formatBytes(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SingleFileSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const previewUrl = `${BACKEND}/api/files/${id}/preview`;
  const downloadUrl = `${BACKEND}/api/files/${id}/download`;

  useEffect(() => {
    fetch(`${BACKEND}/api/files/${id}/info`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) setFile(data.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const isImage = file?.mimetype?.includes("image") || file?.originalName?.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i);
  const isPdf = file?.mimetype?.includes("pdf") || file?.originalName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/logo.png" width={32} height={32} alt="Kampung Cetak" className="object-contain w-full h-full" />
          </div>
          <span className="text-white font-semibold text-sm">Kampung Cetak</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Loading file...</span>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-white text-xl font-semibold">File Not Found</h1>
            <p className="text-white/50 text-sm max-w-xs">
              This file may have been removed or the link is invalid.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {/* File Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Preview Area */}
              <div className="bg-black/40 min-h-[300px] flex items-center justify-center relative">
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt={file.originalName}
                    className="max-w-full max-h-[500px] object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : isPdf ? (
                  <iframe
                    src={`${previewUrl}&inline=true`}
                    className="w-full h-[500px] border-none"
                    title={file.originalName}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/40 py-16">
                    <File className="w-16 h-16" />
                    <span className="text-sm">Preview not available</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    {isImage ? (
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                    ) : isPdf ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <File className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-white font-semibold text-lg truncate" title={file.originalName}>
                      {file.originalName}
                    </h1>
                    <div className="flex gap-3 mt-1 text-white/50 text-sm">
                      <span>{formatBytes(file.size)}</span>
                      {file.createdAt && (
                        <>
                          <span>·</span>
                          <span>{format(new Date(file.createdAt), "d MMM yyyy")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <a href={downloadUrl} download={file.originalName} className="block mt-5">
                  <Button className="w-full gap-2 h-11 text-sm font-semibold" size="lg">
                    <Download className="w-4 h-4" />
                    Download File
                  </Button>
                </a>

                <p className="text-center text-white/30 text-xs mt-4">
                  Shared via Kampung Cetak · kampungcetak.com
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
