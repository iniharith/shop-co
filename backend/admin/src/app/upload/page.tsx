"use client";

import React, { useState } from "react";
import { Upload, FileText, Check, Loader2, Image as ImageIcon, X, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function CustomerUploadPortal() {
  const [orderId, setOrderId] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [item, setItem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStats, setUploadStats] = useState({ current: 0, total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const parsePastedText = (text: string) => {
    let newOrderId = orderId;
    let newPhone = phoneNumber;
    let newItem = item;
    let newUsername = username;
    
    // Example WhatsApp message format:
    // ORDER 9 JULAI 2026
    // Phone Number: 0194728328
    // Item: FRAME GAMBAR CUSTOM
    // USERNAME
    // cheryllee8328

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Check if it's a multi-line pasted message
    if (lines.length >= 2) {
      // 1. First line usually has "ORDER "
      if (lines[0].toUpperCase().startsWith("ORDER ") || lines[0].toUpperCase().startsWith("ORDER ID:") || lines[0].toUpperCase().startsWith("ORDER NUMBER:")) {
        newOrderId = lines[0].replace(/ORDER ID:/i, '').replace(/ORDER NUMBER:/i, '').replace(/ORDER/i, '').replace(/#/g, '').trim();
      } else {
        newOrderId = lines[0].replace(/#/g, '').trim();
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.startsWith("phone number:") || lowerLine.startsWith("no telefon:")) {
          newPhone = line.split(':')[1].trim();
        } else if (lowerLine.startsWith("item:") || lowerLine.startsWith("produk:")) {
          newItem = line.split(':')[1].trim();
        } else if (lowerLine === "username" || lowerLine === "nama pengguna") {
          if (i + 1 < lines.length) {
            newUsername = lines[i + 1].trim();
          }
        }
      }
      
      setOrderId(newOrderId);
      setPhoneNumber(newPhone);
      setItem(newItem);
      setUsername(newUsername);
      return true; // Successfully parsed
    }
    return false; // Not a multi-line message
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrderId(val);
  };

  const handleOrderIdPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (parsePastedText(pasted)) {
      e.preventDefault();
    } else {
      // If not multi-line, maybe just strip 'ORDER' and '#' if they pasted just the order ID
      const cleaned = pasted.replace(/ORDER ID:/i, '').replace(/ORDER NUMBER:/i, '').replace(/ORDER/i, '').replace(/#/g, '').trim();
      if (cleaned !== pasted) {
        e.preventDefault();
        setOrderId(cleaned);
      }
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
    if (!phoneNumber.trim()) {
      toast.error("Please enter your Phone Number");
      return;
    }
    if (!item.trim()) {
      toast.error("Please enter the Item name");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setUploadStats({ current: 0, total: selectedFiles.length });
    const toastId = toast.loading(`Uploading files (0/${selectedFiles.length})...`);

    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        toast.loading(`Uploading files (${i + 1}/${selectedFiles.length})...`, { id: toastId });
        setUploadStats({ current: i + 1, total: selectedFiles.length });
        const file = selectedFiles[i];
        
        // 1. Get presigned URL
        const urlRes = await fetch(`${BACKEND}/api/files/customer/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            filename: file.name, 
            contentType: file.type,
            orderId: orderId.trim(),
            username: username.trim(),
            phoneNumber: phoneNumber.trim(),
            item: item.trim()
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
          username: username.trim(),
          phoneNumber: phoneNumber.trim(),
          item: item.trim()
        })
      });
      
      if (!metaRes.ok) throw new Error("Failed to save file metadata");

      const data = await metaRes.json();
      const adminDeepLink = `https://admin.kampungcetak.com/admin/artworks?folder=${encodeURIComponent(username.trim() + "-" + orderId.trim() + "-" + data.task._id)}`;
      setGeneratedLink(adminDeepLink);

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
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 text-lg mb-4"
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              toast.success("Link copied to clipboard!");
            }}
          >
            Copy Link and Give to Admin
          </Button>

          <Button 
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={() => {
              setSuccess(false);
              setOrderId("");
              setUsername("");
              setPhoneNumber("");
              setItem("");
              setGeneratedLink("");
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
              <label className="text-sm font-medium text-white/80">Order Number / Order ID <span className="text-red-500">*</span></label>
              <Input 
                placeholder="e.g. #12345 or paste details here" 
                value={orderId}
                onChange={handleOrderIdChange}
                onPaste={handleOrderIdPaste}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Phone Number <span className="text-red-500">*</span></label>
              <Input 
                placeholder="e.g. +60123456789" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Item <span className="text-red-500">*</span></label>
              <Input 
                placeholder="e.g. Business Card, Banner" 
                value={item}
                onChange={(e) => setItem(e.target.value)}
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
      
      <div className="text-center mt-8 space-y-2">
        <p className="text-xs text-white/40 font-medium">
          By uploading, you agree that this artwork is final and ready for production.
        </p>
        <p className="text-[11px] text-white/30">
          For your privacy and security, all uploaded files are automatically permanently deleted after 30 days.
          <br />
          Please refer to our Terms & Conditions for more details regarding our data policy.
        </p>
      </div>

      {uploading && uploadStats.total > 0 && (
        <div className="fixed top-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <div className="relative flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Uploading Files</h3>
            <p className="text-xs text-muted-foreground font-medium">
              File {uploadStats.current} of {uploadStats.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
