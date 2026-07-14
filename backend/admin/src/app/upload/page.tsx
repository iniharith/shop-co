"use client";

import React, { useState } from "react";
import { Upload, FileText, Check, Loader2, Image as ImageIcon, X, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";


const t = {
  en: {
    uploadComplete: "Upload Complete!",
    thankYou: (name: string, id: string) => `Thank you, ${name}. Your artwork for Order #${id} has been successfully submitted to our team.`,
    copyLink: "Copy Link to Your Artwork AND GIVE TO ADMIN",
    uploadMore: "Upload More Files",
    fileUploadTitle: "File Upload",
    orderIdLabel: "Order Number / Order ID",
    orderIdPlaceholder: "e.g. #12345 or paste details here",
    nameLabel: "Username / Name",
    namePlaceholder: "Your name",
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g. +60123456789",
    itemLabel: "Item",
    itemPlaceholder: "e.g. Business Card, Banner",
    uploadArtworkTitle: "Upload your artwork",
    dragDrop: "Drag and drop or click to browse files",
    selectFiles: "Select Files",
    filesSelected: "File(s) Selected",
    submitArtwork: "Submit Artwork",
    uploadingCloud: "Uploading directly to cloud...",
    terms1: "By uploading, you agree that this artwork is final and ready for production.",
    terms2: "For your privacy and security, all uploaded files are automatically permanently deleted after 30 days.",
    terms3: "Please refer to our Terms & Conditions for more details regarding our data policy.",
    uploadingFiles: "Uploading Files",
    fileOf: (curr: number, tot: number) => `File ${curr} of ${tot}`,
    errOrderId: "Please enter your Order ID",
    errUsername: "Please enter your Username",
    errPhone: "Please enter your Phone Number",
    errItem: "Please enter the Item name",
    errNoFiles: "Please select at least one file to upload",
    uploadingStatus: (curr: number, tot: number) => `Uploading files (${curr}/${tot})...`,
    successStatus: "Files uploaded successfully!",
    errUploadFailed: "Upload failed. Please try again.",
    linkCopied: "Link copied to clipboard!"
  },
  ms: {
    uploadComplete: "Muat Naik Selesai!",
    thankYou: (name: string, id: string) => `Terima kasih, ${name}. Karya seni anda untuk Pesanan #${id} telah berjaya dihantar kepada pasukan kami.`,
    copyLink: "Salin Pautan ke Karya Seni Anda DAN BERIKAN KEPADA ADMIN",
    uploadMore: "Muat Naik Lebih Banyak Fail",
    fileUploadTitle: "Muat Naik Fail",
    orderIdLabel: "Nombor Pesanan / ID Pesanan",
    orderIdPlaceholder: "cth. #12345 atau tampal butiran di sini",
    nameLabel: "Nama Pengguna / Nama",
    namePlaceholder: "Nama anda",
    phoneLabel: "Nombor Telefon",
    phonePlaceholder: "cth. +60123456789",
    itemLabel: "Item",
    itemPlaceholder: "cth. Kad Perniagaan, Banner",
    uploadArtworkTitle: "Muat naik karya seni anda",
    dragDrop: "Seret dan lepas atau klik untuk menyemak imbas fail",
    selectFiles: "Pilih Fail",
    filesSelected: "Fail Dipilih",
    submitArtwork: "Hantar Karya Seni",
    uploadingCloud: "Memuat naik terus ke awan...",
    terms1: "Dengan memuat naik, anda bersetuju bahawa karya seni ini adalah muktamad dan sedia untuk pengeluaran.",
    terms2: "Untuk privasi dan keselamatan anda, semua fail yang dimuat naik akan dipadam secara kekal secara automatik selepas 30 hari.",
    terms3: "Sila rujuk Terma & Syarat kami untuk butiran lanjut mengenai dasar data kami.",
    uploadingFiles: "Memuat Naik Fail",
    fileOf: (curr: number, tot: number) => `Fail ${curr} daripada ${tot}`,
    errOrderId: "Sila masukkan ID Pesanan anda",
    errUsername: "Sila masukkan Nama Pengguna anda",
    errPhone: "Sila masukkan Nombor Telefon anda",
    errItem: "Sila masukkan nama Item",
    errNoFiles: "Sila pilih sekurang-kurangnya satu fail untuk dimuat naik",
    uploadingStatus: (curr: number, tot: number) => `Memuat naik fail (${curr}/${tot})...`,
    successStatus: "Fail berjaya dimuat naik!",
    errUploadFailed: "Muat naik gagal. Sila cuba lagi.",
    linkCopied: "Pautan disalin ke papan keratan!"
  }
};


type FileStatus = "pending" | "uploading" | "done" | "error";
interface FileState {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  uploaded?: { key: string; originalName: string; mimetype: string; size: number; path: string };
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB — generous for print files, but stops accidental huge uploads
const UPLOAD_CONCURRENCY = 3;

// fetch with a hard timeout — a plain fetch() with no timeout can hang
// forever on a flaky connection, which is what made this page look "stuck".
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your internet connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// XHR (not fetch) so we get real upload progress for the S3 PUT, and a
// hard timeout so a stalled upload fails visibly instead of hanging.
function uploadToS3WithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 180000; // 3 minutes — large print files over mobile data need headroom
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (status ${xhr.status}). Please try again.`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Please check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Please check your connection and try again."));
    xhr.send(file);
  });
}

export default function CustomerUploadPortal() {
  const [lang, setLang] = useState<'en' | 'ms'>('en');
  const langDict = t[lang];
  // The root layout sets `overflow-hidden` on <body> for the admin dashboard's
  // internal-panel-scroll layout. This public page isn't part of that layout —
  // it's a simple centered card that needs normal page scroll. Without this,
  // selecting many files pushes the Submit button below the viewport with no
  // way to reach it. Scoped to this page only; restored on unmount.
  React.useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "auto";
    return () => { body.style.overflow = prevOverflow; };
  }, []);

  const [orderId, setOrderId] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [item, setItem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [fileStates, setFileStates] = useState<FileState[]>([]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const tooBig = incoming.filter(f => f.size > MAX_FILE_SIZE);
    const ok = incoming.filter(f => f.size <= MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.map(f => f.name).join(", ")} ${tooBig.length > 1 ? "are" : "is"} over the 200MB limit and won't be uploaded.`);
    }
    setFileStates(prev => [...prev, ...ok.map(file => ({ file, status: "pending" as FileStatus, progress: 0 }))]);
    e.target.value = ""; // allow re-selecting the same file after removal
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
    setFileStates(prev => prev.filter((_, i) => i !== index));
  };

  const uploadOneFile = async (index: number) => {
    const { file } = fileStates[index];
    setFileStates(prev => prev.map((f, i) => i === index ? { ...f, status: "uploading", progress: 0, error: undefined } : f));

    try {
      // 1. Get presigned URL (10s — this is just a tiny JSON call)
      const urlRes = await fetchWithTimeout(`${BACKEND}/api/files/customer/upload-url`, {
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
      }, 30000);

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to get upload link");
      }
      const { url, key, publicUrl } = await urlRes.json();

      // 2. Upload directly to S3 with real progress + its own timeout
      await uploadToS3WithProgress(url, file, (pct) => {
        setFileStates(prev => prev.map((f, i) => i === index ? { ...f, progress: pct } : f));
      });

      const uploaded = {
        key,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: publicUrl
      };
      setFileStates(prev => prev.map((f, i) => i === index ? { ...f, status: "done", progress: 100, uploaded } : f));
      return true;
    } catch (err: any) {
      setFileStates(prev => prev.map((f, i) => i === index ? { ...f, status: "error", error: err.message || "Upload failed" } : f));
      return false;
    }
  };

  const handleUpload = async () => {
    if (!orderId.trim()) return toast.error(langDict.errOrderId);
    if (!username.trim()) return toast.error(langDict.errUsername);
    if (!phoneNumber.trim()) return toast.error(langDict.errPhone);
    if (!item.trim()) return toast.error(langDict.errItem);
    if (fileStates.length === 0) return toast.error(langDict.errNoFiles);

    setUploading(true);
    const toastId = toast.loading("Uploading files...");

    // Only upload files that aren't already "done" — a retry after a partial
    // failure won't re-upload files that already succeeded.
    const pendingIndexes = fileStates
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.status !== "done")
      .map(({ i }) => i);

    // Run uploads with limited concurrency instead of one-at-a-time — this is
    // the main fix for the page feeling slow with multiple files.
    let cursor = 0;
    let completedCount = 0;
    async function worker() {
      while (cursor < pendingIndexes.length) {
        const myIndex = pendingIndexes[cursor++];
        await uploadOneFile(myIndex);
        completedCount++;
        toast.loading(`Uploading files (${completedCount}/${pendingIndexes.length})...`, { id: toastId });
      }
    }
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, pendingIndexes.length) }, worker));

    // Re-read latest state after all workers finish
    setFileStates(current => {
      const allDone = current.every(f => f.status === "done");
      const anyFailed = current.some(f => f.status === "error");

      if (!allDone) {
        toast.error(
          anyFailed
            ? "Some files failed to upload. Fix your connection and press Submit again — completed files won't be re-uploaded."
            : "Upload incomplete. Please try again.",
          { id: toastId }
        );
        setUploading(false);
        return current;
      }

      // 3. All files uploaded to S3 — now save metadata (10s timeout)
      const uploadedFiles = current.map(f => f.uploaded).filter(Boolean);
      fetchWithTimeout(`${BACKEND}/api/files/customer/save-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploadedFiles,
          orderId: orderId.trim(),
          username: username.trim(),
          phoneNumber: phoneNumber.trim(),
          item: item.trim()
        })
      }, 60000)
        .then(async (metaRes) => {
          if (!metaRes.ok) throw new Error("Failed to save file metadata. Please try submitting again.");
          const data = await metaRes.json();
          setGeneratedLink(`https://admin.kampungcetak.com/share/${data.shareLinkSlug}`);
          toast.success(langDict.successStatus, { id: toastId });
          setSuccess(true);
          setFileStates([]);
        })
        .catch((err: any) => {
          // Files are already safely in S3 at this point — pressing Submit
          // again will retry only the metadata save, not re-upload files.
          toast.error(err.message || "Couldn't finalize your submission. Please press Submit again.", { id: toastId });
        })
        .finally(() => setUploading(false));

      return current;
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        
      <div className="absolute top-4 right-4 flex bg-white/5 rounded-full p-1 border border-white/10 z-50">
        <button 
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'en' ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('ms')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'ms' ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
        >
          MS
        </button>
      </div>

        
      <div className="absolute top-4 right-4 flex bg-white/5 rounded-full p-1 border border-white/10 z-50">
        <button 
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'en' ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('ms')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'ms' ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
        >
          MS
        </button>
      </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-xl font-bold tracking-tight">Kampung Cetak</h1>
        </div>
        
        <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">{langDict.uploadComplete}</h2>
          <p className="text-white/60 mb-8">
            {langDict.thankYou(username, orderId)}
          </p>
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 text-lg mb-4"
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              toast.success(langDict.linkCopied);
            }}
          >
            {langDict.copyLink}
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
            {langDict.uploadMore}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
        <h1 className="text-xl font-bold tracking-tight">Kampung Cetak <span className="text-white/40 font-normal">· {langDict.fileUploadTitle}</span></h1>
      </div>

      <div className="max-w-xl w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Order ID <span className="text-red-500">*</span></label>
              <Input 
                placeholder={langDict.orderIdPlaceholder} 
                value={orderId}
                onChange={handleOrderIdChange}
                onPaste={handleOrderIdPaste}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{langDict.nameLabel} <span className="text-red-500">*</span></label>
              <Input 
                placeholder={langDict.namePlaceholder} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{langDict.phoneLabel} <span className="text-red-500">*</span></label>
              <Input 
                placeholder={langDict.phonePlaceholder} 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{langDict.itemLabel} <span className="text-red-500">*</span></label>
              <Input 
                placeholder={langDict.itemPlaceholder} 
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
            <h3 className="text-lg font-medium mb-1">{langDict.uploadArtworkTitle}</h3>
            <p className="text-sm text-white/40 mb-4">{langDict.dragDrop}</p>
            <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white pointer-events-none relative z-0">
              Select Files
            </Button>
          </div>

          {fileStates.length > 0 && (
            <div className="bg-black/40 rounded-lg p-4 border border-white/5 space-y-3 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-medium text-white/60 mb-2">{fileStates.length} {langDict.filesSelected}</h4>
              {fileStates.map(({ file, status, progress, error }, i) => (
                <div key={i} className="bg-[#1a1a1a] p-2.5 rounded border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {file.type.includes('image') ? (
                        <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-white/40">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {status === "uploading" && ` · Uploading ${progress}%`}
                          {status === "done" && " · Uploaded"}
                          {status === "error" && ` · ${error || "Failed"}`}
                        </p>
                      </div>
                    </div>
                    {status === "done" ? (
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <button
                        onClick={() => removeFile(i)}
                        disabled={uploading}
                        className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {status === "uploading" && (
                    <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-yellow-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-12 text-lg"
            onClick={handleUpload}
            disabled={uploading || fileStates.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Uploading directly to cloud...
              </>
            ) : (
              langDict.submitArtwork
            )}
          </Button>

        </div>
      </div>
      
      <div className="text-center mt-8 space-y-2">
        <p className="text-xs text-white/40 font-medium">
          {langDict.terms1}
        </p>
        <p className="text-[11px] text-white/30">
          {langDict.terms2}
          <br />
          {langDict.terms3}
        </p>
      </div>

      {uploading && fileStates.length > 0 && (
        <div className="fixed top-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <div className="relative flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Uploading Files</h3>
            <p className="text-xs text-muted-foreground font-medium">
              {fileStates.filter(f => f.status === "done").length} of {fileStates.length} complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
