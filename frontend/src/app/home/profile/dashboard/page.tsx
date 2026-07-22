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
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none select-none">🖨️</div>
        <div className="relative">
          <h1 className="text-3xl font-extrabold text-black mb-2">
            Selamat Datang! 👋
          </h1>
          <p className="text-gray-600 text-base max-w-lg">
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
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-black px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-gray-200"
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
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-extrabold ${s.color} ${loading ? 'animate-pulse' : ''}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold">Tindakan Pantas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.filter(a => a.title !== 'Jejak Parcel').map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-white border border-gray-200 rounded-2xl p-5 group transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              {a.icon}
            </div>
            <div className="font-bold text-black text-base mb-1">{a.title}</div>
            <div className="text-sm text-gray-500">{a.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-black">📁 Fail Terkini</h3>
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
                <div key={f._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="text-xl flex-shrink-0">
                    {f.mimetype.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">{f.originalName}</p>
                    <p className="text-xs text-gray-500">{formatSize(f.size)} · {formatDate(f.uploadedAt)}</p>
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
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-black">📦 Penghantaran Terkini</h3>
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
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors group"
                >
                  <div className="text-xl flex-shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-black truncate group-hover:text-primary transition-colors">
                      {p.trackingNumber}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(p.updatedAt)}</p>
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
