/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useState, useRef, useCallback } from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Download, X, ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import AxiosInstance from "@/utils/axios";

export default function ImageUpscalePage() {
  const { data: session } = useSession();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [scale, setScale] = useState<"2" | "4">("2");
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setSourceFile(file);
    setResultImage(null);
    setSourcePreview(URL.createObjectURL(file));
  }, []);

  const handleUpscale = async () => {
    if (!sourceFile) return;
    setIsUpscaling(true);
    const toastId = toast.loading(`Upscaling ${scale}x locally… this can take a moment`);
    try {
      const formData = new FormData();
      formData.append("image", sourceFile);
      formData.append("scale", scale);

      const res = await AxiosInstance(session?.user?.token).post("/api/tools/upscale", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 5 * 60 * 1000, // large images on CPU can take a while — 5 min ceiling
      });

      if (!res.data.success) throw new Error(res.data.message || "Upscale failed");

      setResultImage(res.data.image);
      setSliderPos(50);
      toast.success("Upscaled image ready", { id: toastId });
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to upscale image";
      toast.error(message, { id: toastId });
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage || !sourceFile) return;
    const baseName = sourceFile.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `${baseName}-upscaled-${scale}x.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setSourceFile(null);
    setSourcePreview(null);
    setResultImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4 min-w-0 w-full bg-background/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between">
          <Heading
            title="Image Upscale ✨"
            description="High-quality local upscaler for low-res customer photos before printing — no cost per image"
          />
        </div>
        <Separator />

        {!sourcePreview ? (
          // ── Empty state: drop zone ──────────────────────────────────
          <div
            className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 text-center transition-colors cursor-pointer ${
              isDragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageUp className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Drop an image here, or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">JPEG or PNG — HEIC isn't supported yet</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          // ── Working state: preview + controls ───────────────────────
          <div className="space-y-4">
            <Card className="overflow-hidden bg-muted/10 border-border/50">
              <CardContent className="p-0">
                {resultImage ? (
                  // Before/after comparison slider
                  <div className="relative w-full aspect-video bg-black select-none">
                    <img src={resultImage} alt="Upscaled" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img src={sourcePreview} alt="Original" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPos}%` }}
                    />
                    <span className="absolute top-3 left-3 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded-full">Original</span>
                    <span className="absolute top-3 right-3 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded-full">Upscaled {scale}x</span>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-black flex items-center justify-center">
                    <img src={sourcePreview} alt="Selected" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>

            {resultImage && (
              <div className="px-1">
                <Slider value={[sliderPos]} onValueChange={([v]) => setSliderPos(v)} max={100} step={1} />
                <p className="text-xs text-muted-foreground text-center mt-1">Drag to compare original vs. upscaled</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Scale:</span>
                <ToggleGroup type="single" value={scale} onValueChange={(v) => v && setScale(v as "2" | "4")} disabled={isUpscaling}>
                  <ToggleGroupItem value="2" className="px-4">2x</ToggleGroupItem>
                  <ToggleGroupItem value="4" className="px-4">4x</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={reset} disabled={isUpscaling}>
                  <X className="w-4 h-4 mr-2" /> Start Over
                </Button>
                {resultImage ? (
                  <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                    <Download className="w-4 h-4 mr-2" /> Download Result
                  </Button>
                ) : (
                  <Button onClick={handleUpscale} disabled={isUpscaling} className="bg-primary hover:bg-primary/90">
                    {isUpscaling ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Upscaling…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Upscale {scale}x</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
