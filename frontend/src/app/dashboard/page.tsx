'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    pending: { label: '⏳ Menunggu', cls: 'bg-yellow-500/15 text-yellow-400' },
    picked_up: { label: '📦 Dikutip', cls: 'bg-blue-500/15 text-blue-400' },
    in_transit: { label: '🚚 Transit', cls: 'bg-purple-500/15 text-purple-400' },
    out_for_delivery: { label: '🛵 Penghantaran', cls: 'bg-orange-500/15 text-orange-400' },
    delivered: { label: '✅ Dihantar', cls: 'bg-emerald-500/15 text-emerald-400' },
    failed: { label: '❌ Gagal', cls: 'bg-red-500/15 text-red-400' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-gray-500/15 text-gray-400' };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.cls}`}>{c.label}</span>;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

const QUICK_ACTIONS = [
  {
    icon: '☁️',
    title: 'Muat Naik Fail',
    desc: 'Hantar artwork atau fail cetak anda kepada kami',
    href: '/dashboard/upload',
    gradient: 'from-purple-600 to-indigo-600',
    border: 'hover:border-purple-500/50',
  },
  {
    icon: '📦',
    title: 'Jejak Parcel',
    desc: 'Semak status penghantaran pesanan anda',
    href: '/dashboard/track',
    gradient: 'from-blue-600 to-cyan-600',
    border: 'hover:border-blue-500/50',
  },
  {
    icon: '🛒',
    title: 'Pesanan Saya',
    desc: 'Lihat semua pesanan dan status terkini',
    href: '/orders',
    gradient: 'from-emerald-600 to-teal-600',
    border: 'hover:border-emerald-500/50',
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [recentParcels, setRecentParcels] = useState<RecentParcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [fileRes, parcelRes] = await Promise.all([
          fetch(`${API}/api/files/my`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${API}/api/parcels?limit=5`, { credentials: 'include' }).then(r => r.json()),
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border border-purple-500/20 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] opacity-5 leading-none select-none">🖨️</div>
          <div className="relative">
            <h1 className="text-3xl font-extrabold text-white mb-2">
              Selamat Datang! 👋
            </h1>
            <p className="text-gray-300 text-base max-w-lg">
              Urus pesanan, hantar fail cetak, dan jejak penghantaran anda — semuanya di sini.
            </p>
            <div className="flex gap-4 mt-6 flex-wrap">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 hover:-translate-y-0.5"
              >
                ☁️ Muat Naik Fail
              </Link>
              <Link
                href="/dashboard/track"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-white/10 hover:border-white/20"
              >
                📦 Jejak Parcel
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📄', value: stats?.totalFiles ?? '—', label: 'Fail Dihantar', color: 'text-blue-400' },
            { icon: '🚚', value: stats?.activeDeliveries ?? '—', label: 'Penghantaran Aktif', color: 'text-purple-400' },
            { icon: '🔔', value: stats?.pendingReview ?? '—', label: 'Fail Belum Disemak', color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:border-white/20 transition-colors">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-extrabold ${s.color} ${loading ? 'animate-pulse' : ''}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold mb-4">Tindakan Pantas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`bg-white/[0.03] border border-white/10 ${a.border} rounded-2xl p-5 group transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                {a.icon}
              </div>
              <div className="font-bold text-white text-base mb-1">{a.title}</div>
              <div className="text-sm text-gray-500">{a.desc}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Files */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">📁 Fail Terkini</h3>
              <Link href="/dashboard/upload" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Lihat semua →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="bg-white/5 animate-pulse h-12 rounded-xl" />)}
              </div>
            ) : recentFiles.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">Tiada fail lagi</p>
                <Link href="/dashboard/upload" className="mt-3 inline-block text-xs text-purple-400 hover:text-purple-300">
                  Muat naik sekarang →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentFiles.map(f => (
                  <div key={f._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="text-xl flex-shrink-0">
                      {f.mimetype.startsWith('image/') ? '🖼️' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.originalName}</p>
                      <p className="text-xs text-gray-500">{formatSize(f.size)} · {formatDate(f.uploadedAt)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      f.adminReviewed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {f.adminReviewed ? '✅' : '⏳'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Parcels */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">📦 Penghantaran Terkini</h3>
              <Link href="/dashboard/track" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Jejak →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="bg-white/5 animate-pulse h-12 rounded-xl" />)}
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
                    href={`/dashboard/track?tracking=${p.trackingNumber}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="text-xl flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium text-white truncate group-hover:text-purple-300 transition-colors">
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
    </div>
  );
}
