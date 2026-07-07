"use client";

import React, { useState } from "react";
import { Upload, FileText, Check, Loader2, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function CustomerUploadPortal() {
  const [orderId, setOrderId] = useState("");
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter your Order ID");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter your Username");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading files directly to cloud...");

    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // 1. Get presigned URL
        const urlRes = await fetch(`${BACKEND}/api/files/customer/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            filename: file.name, 
            contentType: file.type,
            orderId: orderId.trim(),
            username: username.trim()
          })
        });
        
        if (!urlRes.ok) {
          const err = await urlRes.json().catch(() => ({}));
          throw new Error(err.message || "Failed to get upload link");
        }
        
        const { url, key, publicUrl } = await urlRes.json();
        
        // 2. Upload directly to S3
        const s3Res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });
        
        if (!s3Res.ok) throw new Error(`Failed to upload ${file.name}`);
        
        uploadedFiles.push({
          key,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          path: publicUrl
        });
      }

      // 3. Save metadata
      const metaRes = await fetch(`${BACKEND}/api/files/customer/save-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          files: uploadedFiles,
          orderId: orderId.trim(),
          username: username.trim()
        })
      });
      
      if (!metaRes.ok) throw new Error("Failed to save file metadata");

      toast.success("Files uploaded successfully!", { id: toastId });
      setSuccess(true);
      setSelectedFiles([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="mb-8 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-xl font-bold tracking-tight">Kampung Cetak</h1>
        </div>
        
        <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Upload Complete!</h2>
          <p className="text-white/60 mb-8">
            Thank you, {username}. Your artwork for Order #{orderId} has been successfully submitted to our team.
          </p>
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={() => {
              setSuccess(false);
              setOrderId("");
              setUsername("");
            }}
          >
            Upload More Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
        <h1 className="text-xl font-bold tracking-tight">Kampung Cetak <span className="text-white/40 font-normal">· File Upload</span></h1>
      </div>

      <div className="max-w-xl w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Order ID <span className="text-red-500">*</span></label>
              <Input 
                placeholder="e.g. #12345" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Username / Name <span className="text-red-500">*</span></label>
              <Input 
                placeholder="Your name" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-black/20 relative">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
              title="Click to select files"
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
            <h3 className="text-lg font-medium mb-1">Upload your artwork</h3>
            <p className="text-sm text-white/40 mb-4">Drag and drop or click to browse files</p>
            <Button variant="outline" className="border-white/20 hover:bg-white/10 pointer-events-none relative z-0">
              Select Files
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bg-black/40 rounded-lg p-4 border border-white/5 space-y-3 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-medium text-white/60 mb-2">{selectedFiles.length} File(s) Selected</h4>
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1a1a1a] p-2.5 rounded border border-white/5">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.includes('image') ? (
                      <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    disabled={uploading}
                    className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-12 text-lg"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Uploading directly to cloud...
              </>
            ) : (
              "Submit Artwork"
            )}
          </Button>

        </div>
      </div>
      
      <p className="text-xs text-white/30 mt-8">
        By uploading, you agree that this artwork is final and ready for production.
      </p>
    </div>
  );
}
