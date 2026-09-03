/**
 * Coded by Harith
 * Kampungcetak ®
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from "@/components/global/breadcrumb";
import { useSession } from "next-auth/react";

interface DashStats {
  totalFiles: number;
  activeDeliveries: number;
  pendingReview: number;
}

interface RecentFile {
  _id: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  adminReviewed: boolean;
}

interface RecentParcel {
  _id: string;
  trackingNumber: string;
  status: string;
  customerName: string;
  updatedAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('ms-MY', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: '⏳ Menunggu', cls: 'bg-yellow-100 text-yellow-700' },
    picked_up: { label: '📦 Dikutip', cls: 'bg-blue-100 text-blue-700' },
    in_transit: { label: '🚚 Transit', cls: 'bg-purple-100 text-purple-700' },
    out_for_delivery: { label: '🛵 Penghantaran', cls: 'bg-orange-100 text-orange-700' },
    delivered: { label: '✅ Dihantar', cls: 'bg-green-100 text-green-700' },
    failed: { label: '❌ Gagal', cls: 'bg-red-100 text-red-700' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.cls}`}>{c.label}</span>;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

const QUICK_ACTIONS = [
  {
    icon: '☁️',
    title: 'Muat Naik Fail',
    desc: 'Hantar artwork atau fail cetak anda',
    href: '/home/profile/upload',
  },
  {
    icon: '📦',
    title: 'Jejak Parcel',
    desc: 'Semak status penghantaran',
    href: '/home/profile/track',
  },
  {
    icon: '🛒',
    title: 'Pesanan Saya',
    desc: 'Lihat semua pesanan',
    href: '/home/profile/orders',
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [recentParcels, setRecentParcels] = useState<RecentParcel[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();
  const token = session?.user?.token || '';

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const [fileRes, parcelRes] = await Promise.all([
          fetch(`${API}/api/files/my`, { 
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include' 
          }).then(r => r.json()),
          fetch(`${API}/api/parcels?limit=5`, { 
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include' 
          }).then(r => r.json()),
        ]);

        if (fileRes.success) {
          setRecentFiles(fileRes.data.slice(0, 5));
          setStats(prev => ({
            ...(prev || { activeDeliveries: 0, pendingReview: 0 }),
            totalFiles: fileRes.count,
            pendingReview: fileRes.data.filter((f: RecentFile) => !f.adminReviewed).length,
          }));
        }

        if (parcelRes.success) {
          setRecentParcels(parcelRes.data.slice(0, 5));
          const active = parcelRes.data.filter(
            (p: RecentParcel) => !['delivered', 'failed'].includes(p.status)
          ).length;
          setStats(prev => ({
            ...(prev || { totalFiles: 0, pendingReview: 0 }),
            activeDeliveries: active,
          }));
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-600/20 bg-gradient-to-br from-amber-50 to-orange-50 p-8 dark:from-[#282219] dark:to-[#1b1710]">
        <div className="absolute right-0 top-0 select-none text-[120px] leading-none opacity-10">🖨️</div>
        <div className="relative">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-950 dark:text-[#fff8e8]">
            Selamat Datang! 👋
          </h1>
          <p className="max-w-lg text-base text-gray-700 dark:text-[#f7e8c5]/75">
            Urus pesanan, hantar fail cetak, dan jejak penghantaran anda — semuanya di sini.
          </p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <Link
              href="/home/profile/upload"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg"
            >
              ☁️ Muat Naik Fail
            </Link>
            <Link
              href="/home/profile/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              🛒 Pesanan Saya
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📄', value: stats?.totalFiles ?? '—', label: 'Fail Dihantar', color: 'text-blue-600' },
          { icon: '🚚', value: stats?.activeDeliveries ?? '—', label: 'Penghantaran Aktif', color: 'text-purple-600' },
          { icon: '🔔', value: stats?.pendingReview ?? '—', label: 'Fail Belum Disemak', color: 'text-yellow-600' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-extrabold ${s.color} ${loading ? 'animate-pulse' : ''}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
       <h2 className="text-lg font-bold text-foreground">Tindakan Pantas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.filter(a => a.title !== 'Jejak Parcel').map((a) => (
          <Link
            key={a.href}
            href={a.href}
             className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              {a.icon}
            </div>
             <div className="mb-1 text-base font-bold text-foreground">{a.title}</div>
             <div className="text-sm text-muted-foreground">{a.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-bold text-foreground">📁 Fail Terkini</h3>
            <Link href="/home/profile/upload" className="text-xs text-primary hover:underline">
              Lihat semua →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-gray-100 animate-pulse h-12 rounded-xl" />)}
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-500 text-sm">Tiada fail lagi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map(f => (
                 <div key={f._id} className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted">
                  <div className="text-xl flex-shrink-0">
                    {f.mimetype.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="truncate text-sm font-medium text-foreground">{f.originalName}</p>
                     <p className="text-xs text-muted-foreground">{formatSize(f.size)} · {formatDate(f.uploadedAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    f.adminReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {f.adminReviewed ? '✅' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Parcels */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-bold text-foreground">📦 Penghantaran Terkini</h3>
            <Link href="/home/profile/orders" className="text-xs text-primary hover:underline">
              Semua Pesanan →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-gray-100 animate-pulse h-12 rounded-xl" />)}
            </div>
          ) : recentParcels.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-500 text-sm">Tiada parcel aktif</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentParcels.map(p => (
                <Link
                  key={p._id}
                  href={`/home/profile/orders`}
                   className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted"
                >
                  <div className="text-xl flex-shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                     <p className="truncate font-mono text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {p.trackingNumber}
                    </p>
                     <p className="text-xs text-muted-foreground">{formatDate(p.updatedAt)}</p>
                  </div>
                  {statusBadge(p.status)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
