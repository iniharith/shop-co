"use client";

import React, { useState } from "react";
import { Upload, FileText, Check, Loader2, Image as ImageIcon, X, CloudUpload, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";


const t = {
  en: {
    uploadComplete: "Upload Complete!",
    thankYou: (name: string, id: string) => `Thank you, ${name}. Your artwork for Order #${id} has been successfully submitted to our team.`,
    copyLink: "Copy Link and Give to Admin",
    uploadMore: "Upload More Files",
    fileUploadTitle: "File Upload",
    orderIdLabel: "Order ID/Order Number",
    orderIdPlaceholder: "e.g. #12345 or paste details here",
    nameLabel: "Username / Name",
    namePlaceholder: "Your name",
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g. +60123456789",
    itemLabel: "Item",
    itemPlaceholder: "Frame Size, Card, etc",
    addItem: "Add Another Item",
    removeItem: "Remove item",
    qualityWarning: "⚠️ PLEASE SEND HIGH RESOLUTION IMAGE. DO NOT SEND SCREENSHOT IMAGES BECAUSE ITS NOT HIGH QUALITY",
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
    linkCopied: "Link copied to clipboard!",
    itemsHint: "If your order has multiple items, add one section per item — each item becomes its own folder for our team."
  },
  ms: {
    uploadComplete: "Muat Naik Selesai!",
    thankYou: (name: string, id: string) => `Terima kasih, ${name}. Karya seni anda untuk Pesanan #${id} telah berjaya dihantar kepada pasukan kami.`,
    copyLink: "Salin Pautan dan Beri ke Admin",
    uploadMore: "Muat Naik Lebih Banyak Fail",
    fileUploadTitle: "Muat Naik Fail",
    orderIdLabel: "ID Pesanan/Nombor Pesanan",
    orderIdPlaceholder: "cth. #12345 atau tampal butiran di sini",
    nameLabel: "Nama Pengguna / Nama",
    namePlaceholder: "Nama anda",
    phoneLabel: "Nombor Telefon",
    phonePlaceholder: "cth. +60123456789",
    itemLabel: "Item",
    itemPlaceholder: "Saiz Bingkai, Kad, dll",
    addItem: "Tambah Item Lain",
    removeItem: "Buang item",
    qualityWarning: "⚠️ SILA HANTAR GAMBAR BERESOLUSI TINGGI. JANGAN HANTAR GAMBAR TANGKAPAN SKRIN (SCREENSHOT) KERANA KUALITINYA TIDAK BAGUS",
    uploadArtworkTitle: "Muat naik karya seni anda",
    dragDrop: "Seret dan lepas atau klik untuk menyemak imbas fail",
    selectFiles: "Pilih Fail",
    filesSelected: "Fail Dipilih",
    submitArtwork: "Hantar Fail Anda",
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
    linkCopied: "Pautan disalin ke papan keratan!",
    itemsHint: "Jika pesanan anda mempunyai beberapa item, tambah satu bahagian untuk setiap item — setiap item menjadi folder yang berasingan untuk pasukan kami."
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
interface ItemGroup {
  id: string;
  name: string;
  files: FileState[];
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB — generous for print files, but stops accidental huge uploads
const UPLOAD_CONCURRENCY = 3;

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const emptyItemGroup = (): ItemGroup => ({ id: genId(), name: "", files: [] });

// fetch with a hard timeout — a plain fetch() with no timeout can hang
// forever on a flaky connection, which is what made this page look "stuck".
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, credentials: "omit", signal: controller.signal });
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
    // Allow roughly 128 KB/s for large artwork, bounded to 5-30 minutes.
    xhr.timeout = Math.min(30 * 60 * 1000, Math.max(5 * 60 * 1000, Math.ceil(file.size / (128 * 1024) * 1000)));
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
  const [items, setItems] = useState<ItemGroup[]>([emptyItemGroup()]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const addFilesToItem = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const tooBig = incoming.filter(f => f.size > MAX_FILE_SIZE);
    const ok = incoming.filter(f => f.size <= MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.map(f => f.name).join(", ")} ${tooBig.length > 1 ? "are" : "is"} over the 200MB limit and won't be uploaded.`);
    }
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, files: [...item.files, ...ok.map(file => ({ file, status: "pending" as FileStatus, progress: 0 }))] }
        : item
    ));
    e.target.value = ""; // allow re-selecting the same file after removal
  };

  const removeItemFile = (itemId: string, index: number) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, files: item.files.filter((_, i) => i !== index) }
        : item
    ));
  };

  const setItemName = (itemId: string, name: string) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, name } : item));
  };

  const addItemGroup = () => {
    setItems(prev => [...prev, emptyItemGroup()]);
  };

  const removeItemGroup = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItemFile = (itemId: string, index: number, patch: Partial<FileState>) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, files: item.files.map((f, i) => i === index ? { ...f, ...patch } : f) }
        : item
    ));
  };

  const parsePastedText = (text: string) => {
    let newOrderId = orderId;
    let newPhone = phoneNumber;
    let newUsername = username;
    const parsedItems: string[] = [];

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
          parsedItems.push(line.split(':')[1].trim());
        } else if (lowerLine === "username" || lowerLine === "nama pengguna") {
          if (i + 1 < lines.length) {
            newUsername = lines[i + 1].trim();
          }
        }
      }

      setOrderId(newOrderId);
      setPhoneNumber(newPhone);
      setUsername(newUsername);
      if (parsedItems.length > 0) {
        setItems(parsedItems.map(name => ({ id: genId(), name, files: [] })));
      }
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

  const uploadOneFile = async (itemId: string, index: number): Promise<FileState["uploaded"] | null> => {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;
    const { file } = item.files[index];
    updateItemFile(itemId, index, { status: "uploading", progress: 0, error: undefined });

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
          item: item.name.trim()
        })
      }, 30000);

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to get upload link");
      }
      const { url, key, publicUrl } = await urlRes.json();

      // 2. Upload directly to S3 with real progress + its own timeout
      await uploadToS3WithProgress(url, file, (pct) => {
        updateItemFile(itemId, index, { progress: pct });
      });

      const uploaded = {
        key,
        originalName: file.name,
        mimetype: file.type || "application/octet-stream",
        size: file.size,
        path: publicUrl
      };
      updateItemFile(itemId, index, { status: "done", progress: 100, uploaded });
      return uploaded;
    } catch (err: any) {
      updateItemFile(itemId, index, { status: "error", error: err.message || "Upload failed" });
      return null;
    }
  };

  const handleUpload = async () => {
    if (!orderId.trim()) return toast.error(langDict.errOrderId);
    if (!username.trim()) return toast.error(langDict.errUsername);
    if (!phoneNumber.trim()) return toast.error(langDict.errPhone);
    const itemsWithFiles = items.filter(i => i.files.length > 0);
    if (itemsWithFiles.length === 0) return toast.error(langDict.errNoFiles);
    for (const it of itemsWithFiles) {
      if (!it.name.trim()) return toast.error(langDict.errItem);
    }

    setUploading(true);
    const toastId = toast.loading("Uploading files...");

    // Only upload files that aren't already "done" — a retry after a partial
    // failure won't re-upload files that already succeeded.
    const pendingTasks: { itemId: string; index: number }[] = [];
    items.forEach(item => item.files.forEach((f, i) => {
      if (f.status !== "done") pendingTasks.push({ itemId: item.id, index: i });
    }));

    // Run uploads with limited concurrency instead of one-at-a-time — this is
    // the main fix for the page feeling slow with multiple files.
    let cursor = 0;
    let completedCount = 0;
    async function worker() {
      while (cursor < pendingTasks.length) {
        const task = pendingTasks[cursor++];
        await uploadOneFile(task.itemId, task.index);
        completedCount++;
        toast.loading(`Uploading files (${completedCount}/${pendingTasks.length})...`, { id: toastId });
      }
    }
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, pendingTasks.length) }, worker));

    const allDone = items.every(item => item.files.every(f => f.status === "done"));
    if (!allDone) {
      toast.error("Some files failed to upload. Fix your connection and press Submit again; completed files won't be re-uploaded.", { id: toastId });
      setUploading(false);
      return;
    }

    // Finalize outside a React state updater so Strict Mode cannot submit twice.
    try {
      const metaRes = await fetchWithTimeout(`${BACKEND}/api/files/customer/save-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items
            .map(item => ({ name: item.name.trim(), files: item.files.map(f => f.uploaded).filter(Boolean) }))
            .filter(p => p.files.length > 0),
          orderId: orderId.trim(),
          username: username.trim(),
          phoneNumber: phoneNumber.trim()
        })
      }, 60000);
      const data = await metaRes.json().catch(() => null);
      if (!metaRes.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save file metadata. Please try submitting again.");
      }
      if (!data.shareLinkSlug || typeof data.shareLinkSlug !== "string") {
        throw new Error("Upload completed, but the share link could not be created. Please contact admin.");
      }
      setGeneratedLink(`${window.location.origin}/share/${data.shareLinkSlug}`);
      toast.success(langDict.successStatus, { id: toastId });
      setSuccess(true);
      setItems([emptyItemGroup()]);
    } catch (err: any) {
      toast.error(err.message || "Couldn't finalize your submission. Please press Submit again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 pb-24">
        
      <div className="mb-8 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-xl font-bold tracking-tight">Kampung Cetak</h1>
        </div>
        
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10 z-50">
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
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              setSuccess(false);
              setOrderId("");
              setUsername("");
              setPhoneNumber("");
              setItems([emptyItemGroup()]);
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
    <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 pb-24">
      <div className="mb-8 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-xl font-bold tracking-tight">Kampung Cetak <span className="text-white/40 font-normal">· {langDict.fileUploadTitle}</span></h1>
        </div>
        
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10 z-50">
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
      </div>

      <div className="max-w-xl w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{langDict.orderIdLabel} <span className="text-red-500">*</span></label>
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
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-white/80">{langDict.phoneLabel} <span className="text-red-500">*</span></label>
              <Input 
                placeholder={langDict.phonePlaceholder} 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-yellow-500"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 text-xs md:text-sm p-3 rounded-lg text-center font-medium">
            {langDict.qualityWarning}
          </div>

          <div className="space-y-4">
            {items.map((itemGroup, itemIdx) => (
              <div key={itemGroup.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-md px-2 py-1 shrink-0">
                    {langDict.itemLabel} {itemIdx + 1}
                  </span>
                  <Input 
                    placeholder={langDict.itemPlaceholder} 
                    value={itemGroup.name}
                    onChange={(e) => setItemName(itemGroup.id, e.target.value)}
                    className="bg-black/50 border-white/10 focus-visible:ring-yellow-500 flex-1"
                    disabled={uploading}
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItemGroup(itemGroup.id)}
                      disabled={uploading}
                      className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-red-400 transition-colors shrink-0"
                      title={langDict.removeItem}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center bg-black/20 relative">
                  <input 
                    type="file" 
                    multiple 
                    onChange={(e) => addFilesToItem(itemGroup.id, e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                    title="Click to select files"
                  />
                  <Upload className="w-7 h-7 mx-auto mb-2 text-white/40" />
                  <p className="text-sm text-white/40">{langDict.dragDrop}</p>
                </div>

                {itemGroup.files.length > 0 && (
                  <div className="bg-black/40 rounded-lg p-3 border border-white/5 space-y-2 max-h-48 overflow-y-auto">
                    <h4 className="text-xs font-medium text-white/60">{itemGroup.files.length} {langDict.filesSelected}</h4>
                    {itemGroup.files.map(({ file, status, progress, error }, i) => (
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
                              onClick={() => removeItemFile(itemGroup.id, i)}
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
              </div>
            ))}

            <Button 
              variant="outline"
              className="w-full bg-transparent border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={addItemGroup}
              disabled={uploading}
            >
              <Plus className="w-4 h-4 mr-2" /> {langDict.addItem}
            </Button>
          </div>

          <div className="bg-white/5 border border-white/10 text-white/50 text-xs p-3 rounded-lg text-center">
            {langDict.itemsHint}
          </div>

          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-12 text-lg"
            onClick={handleUpload}
            disabled={uploading || items.every(i => i.files.length === 0)}
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

      {uploading && items.some(i => i.files.length > 0) && (
        <div className="fixed top-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <div className="relative flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Uploading Files</h3>
            <p className="text-xs text-muted-foreground font-medium">
              {items.reduce((acc, i) => acc + i.files.filter(f => f.status === "done").length, 0)} of {items.reduce((acc, i) => acc + i.files.length, 0)} complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
