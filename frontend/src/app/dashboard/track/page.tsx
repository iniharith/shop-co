'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

interface ParcelData {
  _id: string;
  trackingNumber: string;
  courier: string;
  status: string;
  events: TrackingEvent[];
  customerName: string;
  updatedAt: string;
  orderId: string;
}

const STEPS = [
  { key: 'pending', label: 'Menunggu', icon: '⏳' },
  { key: 'picked_up', label: 'Dikutip', icon: '📦' },
  { key: 'in_transit', label: 'Dalam Transit', icon: '🚚' },
  { key: 'out_for_delivery', label: 'Dalam Penghantaran', icon: '🛵' },
  { key: 'delivered', label: 'Dihantar', icon: '✅' },
];

function getStepIndex(status: string) {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'text-yellow-400',
    picked_up: 'text-blue-400',
    in_transit: 'text-purple-400',
    out_for_delivery: 'text-orange-400',
    delivered: 'text-emerald-400',
    failed: 'text-red-400',
  };
  return map[status] || 'text-gray-400';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Menunggu Kutipan',
    picked_up: 'Telah Dikutip',
    in_transit: 'Dalam Perjalanan',
    out_for_delivery: 'Dalam Penghantaran',
    delivered: 'Telah Dihantar',
    failed: 'Penghantaran Gagal',
  };
  return map[status] || status;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('ms-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

function TrackContent() {
  const searchParams = useSearchParams();
  const [trackingInput, setTrackingInput] = useState('');
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(0);

  useEffect(() => {
    const t = searchParams.get('tracking');
    if (t) { setTrackingInput(t); searchByTracking(t); }
  }, [searchParams]);

  async function searchByTracking(num?: string) {
    const query = num || trackingInput.trim();
    if (!query) { setError('Sila masukkan nombor penjejakan.'); return; }

    setLoading(true);
    setError('');
    setParcel(null);

    try {
      const res = await fetch(
        `${API}/api/parcels?search=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const found = data.data.find((p: ParcelData) =>
        p.trackingNumber.toLowerCase() === query.toLowerCase()
      );
      if (!found) {
        setError('Nombor penjejakan tidak dijumpai. Sila semak semula.');
        return;
      }
      setParcel(found);
      setExpandedEvent(0);
    } catch (e: any) {
      setError(e.message || 'Gagal menjejak parcel. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = parcel ? getStepIndex(parcel.status) : -1;
  const isDelivered = parcel?.status === 'delivered';
  const isFailed = parcel?.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-purple-400 transition-colors inline-flex items-center gap-2 mb-4">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Jejak Penghantaran
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Masukkan nombor penjejakan untuk semak status parcel anda.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex gap-3">
            <input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchByTracking()}
              placeholder="cth: EPI12345678MY, JT123456789MY..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            <button
              onClick={() => searchByTracking()}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : '🔍'}
              {loading ? 'Mencari...' : 'Jejak'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
            ❌ {error}
          </div>
        )}

        {/* Delivered Celebration */}
        {isDelivered && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center mb-6">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-emerald-400 mb-1">Parcel Telah Dihantar!</h2>
            <p className="text-gray-400 text-sm">Terima kasih kerana menggunakan perkhidmatan Kampung Cetak!</p>
          </div>
        )}

        {/* Failed Notice */}
        {isFailed && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6">
            <h2 className="text-base font-bold text-red-400 mb-1">❌ Penghantaran Gagal</h2>
            <p className="text-gray-400 text-sm">
              Kurier tidak dapat menghantar parcel. Sila hubungi kami melalui WhatsApp untuk bantuan.
            </p>
          </div>
        )}

        {/* Tracking Result */}
        {parcel && (
          <div className="space-y-5">

            {/* Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">No. Penjejakan</div>
                  <div className="text-lg font-bold font-mono text-white">{parcel.trackingNumber}</div>
                  <div className="text-sm text-gray-400 mt-1">Kurier: <span className="text-white font-medium">{parcel.courier}</span></div>
                  {parcel.orderId && (
                    <div className="text-sm text-gray-400">Order: <span className="text-white font-medium">{parcel.orderId}</span></div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-base font-bold ${statusColor(parcel.status)}`}>
                    {statusLabel(parcel.status)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(parcel.updatedAt)}</div>
                </div>
              </div>

              {/* Progress Stepper */}
              {!isFailed && (
                <div className="relative">
                  <div className="flex items-center justify-between relative">
                    {/* connector line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-0" />
                    <div
                      className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700 -z-0"
                      style={{ width: `${Math.min(stepIndex / (STEPS.length - 1), 1) * 100}%` }}
                    />

                    {STEPS.map((step, i) => {
                      const done = i < stepIndex;
                      const current = i === stepIndex;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 border-2
                            ${done
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 text-white'
                              : current
                                ? 'bg-purple-900/50 border-purple-400 text-purple-300 animate-pulse'
                                : 'bg-white/5 border-white/15 text-gray-600'
                            }
                          `}>
                            {step.icon}
                          </div>
                          <div className={`text-center text-xs font-medium max-w-16 leading-tight
                            ${done || current ? 'text-white' : 'text-gray-600'}
                          `}>
                            {step.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tracking History */}
            {parcel.events && parcel.events.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold mb-4">📋 Sejarah Penjejakan</h3>
                <div className="space-y-1">
                  {parcel.events.slice().reverse().map((ev, i) => (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${i === 0 ? 'text-white' : 'text-gray-300'}`}>
                            {ev.status || ev.description}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(ev.timestamp)}</p>
                        </div>
                        <span className="text-gray-500 text-xs">{expandedEvent === i ? '▲' : '▼'}</span>
                      </button>
                      {expandedEvent === i && (
                        <div className="ml-8 px-3 pb-3 text-sm text-gray-400 space-y-1">
                          {ev.description && <p>📝 {ev.description}</p>}
                          {ev.location && <p>📍 {ev.location}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No events */}
            {(!parcel.events || parcel.events.length === 0) && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-3xl mb-3">📡</div>
                <p className="text-gray-400 text-sm">Tiada rekod penjejakan lagi. Sila semak semula sebentar lagi.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!parcel && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400 text-base font-medium">Masukkan nombor penjejakan anda di atas</p>
            <p className="text-gray-600 text-sm mt-2">Nombor penjejakan boleh didapati dalam emel pengesahan pesanan anda</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
