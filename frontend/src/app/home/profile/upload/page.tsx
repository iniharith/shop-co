'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from "@/components/global/breadcrumb";
import ProfileQuickLinks from "@/components/page-sections/profile/profileQuickLinks";
import { useSession } from "next-auth/react";

interface UploadedFile {
  _id: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  orderId?: string;
  notes?: string;
  adminReviewed: boolean;
}

interface QueuedFile {
  file: File;
  preview: string | null;
  id: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('ms-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function UploadPage() {
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [myFiles, setMyFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];
  const MAX_MB = 50;

  useEffect(() => {
    fetchMyFiles();
  }, []);

  async function fetchMyFiles() {
    try {
      if (!token) return;
      const res = await fetch(`${API}/api/files/my`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include' 
      });
      const data = await res.json();
      if (data.success) setMyFiles(data.data);
    } catch (e) {
      console.error('Failed to fetch files:', e);
    } finally {
      setLoadingFiles(false);
    }
  }

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter(f => {
      if (!ALLOWED.includes(f.type)) {
        setError(`Fail "${f.name}" tidak dibenarkan. Hanya JPG, PNG, PDF, TIFF, WEBP.`);
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`Fail "${f.name}" terlalu besar (maks ${MAX_MB}MB).`);
        return false;
      }
      return true;
    });

    const newItems: QueuedFile[] = valid.map(f => ({
      file: f,
      id: `${Date.now()}-${Math.random()}`,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));

    setQueue(prev => [...prev, ...newItems]);
    setError('');
  }, [ALLOWED]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  function removeFromQueue(id: string) {
    setQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(q => q.id !== id);
    });
  }

  async function handleUpload() {
    if (!queue.length) { setError('Sila pilih sekurang-kurangnya satu fail.'); return; }
    setUploading(true);
    setError('');

    const formData = new FormData();
    queue.forEach(q => formData.append('files', q.file));
    if (orderId) formData.append('orderId', orderId);
    if (notes) formData.append('notes', notes);

    try {
      const res = await fetch(`${API}/api/files/upload`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUploadSuccess(true);
      setQueue([]);
      setOrderId('');
      setNotes('');
      await fetchMyFiles();
    } catch (e: any) {
      setError(e.message || 'Muat naik gagal. Cuba lagi.');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setUploadSuccess(false);
    setError('');
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Header */}
      <div className="mb-2">
        <Link href="/home/profile/dashboard" className="text-sm text-primary hover:underline transition-colors inline-flex items-center gap-2 mb-4">
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-black">
          Muat Naik Fail
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Hantar artwork atau fail cetak anda. Kami akan semak dan proses pesanan anda.
        </p>
      </div>

          {/* Success State */}
          {uploadSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Fail Berjaya Dihantar!</h2>
              <p className="text-green-600 mb-6">
                Pasukan kami akan menyemak fail anda tidak lama lagi. Anda akan menerima notifikasi WhatsApp.
              </p>
              <button
                onClick={resetForm}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                + Muat Naik Fail Lain
              </button>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Order ID */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  No. Pesanan (pilihan)
                </label>
                <input
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="cth: ORD-2026-001"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Drop Zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                  ${dragActive
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.tiff,.pdf"
                  className="hidden"
                  onChange={e => addFiles(Array.from(e.target.files || []))}
                />
                <div className="text-5xl mb-4">☁️</div>
                <p className="text-base font-semibold text-black mb-1">Seret fail ke sini atau klik untuk pilih</p>
                <p className="text-sm text-gray-500">JPG, PNG, PDF, TIFF, WEBP · Sehingga {MAX_MB}MB setiap fail · Maks 10 fail</p>
              </div>

              {/* File Queue */}
              {queue.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Fail Dipilih ({queue.length})
                  </div>
                  <div className="space-y-3">
                    {queue.map(q => (
                      <div key={q.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        {q.preview ? (
                          <img src={q.preview} alt={q.file.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl flex-shrink-0 border border-gray-200">📄</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{q.file.name}</p>
                          <p className="text-xs text-gray-500">{formatSize(q.file.size)}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); removeFromQueue(q.id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nota kepada Admin (pilihan)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Sila cetak pada kertas A3 glossy, 2 keping..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  ❌ {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleUpload}
                disabled={uploading || !queue.length}
                className={`
                  w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3
                  ${uploading || !queue.length
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-md'
                  }
                `}
              >
                {uploading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sedang memuat naik...
                  </>
                ) : (
                  <>☁️ Hantar Fail ({queue.length})</>
                )}
              </button>
            </div>
          )}

          {/* Previous Uploads */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-black">
              📂 Fail Saya Yang Lepas
            </h2>
            {loadingFiles ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-gray-100 animate-pulse h-16 rounded-xl" />
                ))}
              </div>
            ) : myFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="text-4xl mb-3">📭</div>
                <p>Tiada fail dimuat naik lagi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myFiles.map(f => (
                  <div key={f._id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="text-2xl">{f.mimetype.startsWith('image/') ? '🖼️' : '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{f.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(f.size)} · {formatDate(f.uploadedAt)}
                        {f.orderId && ` · Order: ${f.orderId}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      f.adminReviewed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {f.adminReviewed ? '✅ Disemak' : '⏳ Menunggu'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
