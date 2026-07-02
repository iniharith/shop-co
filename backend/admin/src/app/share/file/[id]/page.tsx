/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  File,
  AlertCircle,
  ExternalLink,
  Calendar,
  HardDrive,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle/theme-toggle";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function formatBytes(bytes: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SingleFileSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const proxyBase = `${BACKEND}/api/files/proxy-download`;
  const previewSrc = file?.path
    ? `${proxyBase}?url=${encodeURIComponent(file.path)}&name=${encodeURIComponent(file.originalName)}&stream=true&inline=true`
    : null;
  const downloadUrl = `${BACKEND}/api/files/${id}/download`;

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading file…</span>
      </div>
    </div>
  );

  // ── Not Found ────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="p-12 text-center text-muted-foreground rounded-2xl max-w-md"
        style={{
          background: "hsl(var(--card) / 0.7)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid hsl(var(--border) / 0.6)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <AlertCircle className="w-10 h-10 mx-auto mb-4 text-destructive/60" />
        <h2 className="text-lg font-semibold mb-2 text-foreground">File Not Found</h2>
        <p className="text-sm">This link is invalid or the file has been removed.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">

      {/* ── Gradient mesh background ─────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* Light mode blobs */}
        <div className="dark:hidden absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-300/30 blur-[120px]" />
        <div className="dark:hidden absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-sky-300/20 blur-[100px]" />
        <div className="dark:hidden absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-emerald-200/25 blur-[100px]" />
        {/* Dark mode blobs */}
        <div className="hidden dark:block absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-yellow-500/15 blur-[140px]" />
        <div className="hidden dark:block absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-yellow-400/10 blur-[120px]" />
        <div className="hidden dark:block absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "hsl(var(--card) / 0.6)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: "1px solid hsl(var(--border) / 0.5)",
          boxShadow: "0 1px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
              <Image src="/logo.png" width={28} height={28} alt="Kampung Cetak" className="object-contain w-full h-full" />
            </div>
            <span className="font-semibold text-sm text-foreground">Kampung Cetak</span>
            <span className="hidden sm:block text-muted-foreground text-sm">· File Share</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* File Info Card */}
        <div
          className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{
            background: "hsl(var(--card) / 0.7)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            border: "1px solid hsl(var(--border) / 0.6)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          }}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {isImage ? (
              <ImageIcon className="w-6 h-6 text-primary" />
            ) : isPdf ? (
              <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />
            ) : (
              <File className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Filename & Meta */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate" title={file.originalName}>
              {file.originalName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {formatBytes(file.size) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <HardDrive className="w-3 h-3" />
                  {formatBytes(file.size)}
                </span>
              )}
              {file.createdAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(file.createdAt), "d MMM yyyy")}
                </span>
              )}
              {file.mimetype && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {file.mimetype.split("/")[1]?.toUpperCase() || file.mimetype}
                </Badge>
              )}
            </div>
          </div>

          {/* Download */}
          <a href={downloadUrl} download={file.originalName} className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </a>
        </div>

        {/* Preview Card */}
        {previewSrc && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "hsl(var(--card) / 0.7)",
              backdropFilter: "blur(20px) saturate(1.4)",
              WebkitBackdropFilter: "blur(20px) saturate(1.4)",
              border: "1px solid hsl(var(--border) / 0.6)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
            >
              <span className="text-sm font-medium text-foreground">Preview</span>
              <a
                href={previewSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open in new tab
              </a>
            </div>

            {/* Image */}
            {isImage && (
              <div className="bg-muted/20 flex items-center justify-center p-4 min-h-[280px]">
                <img
                  src={previewSrc}
                  alt={file.originalName}
                  className="max-w-full max-h-[600px] object-contain rounded-xl shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* PDF */}
            {isPdf && (
              <div className="w-full h-[600px]">
                <iframe
                  src={previewSrc}
                  className="w-full h-full border-none"
                  title={file.originalName}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs pb-4">
          Shared via{" "}
          <a href="https://kampungcetak.com" className="hover:text-primary transition-colors font-medium">
            Kampung Cetak
          </a>
        </p>
      </main>
    </div>
  );
}
