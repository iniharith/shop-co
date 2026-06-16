'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from "@/components/global/breadcrumb";
import ProfileQuickLinks from "@/components/page-sections/profile/profileQuickLinks";

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
    pending: 'text-yellow-600',
    picked_up: 'text-blue-600',
    in_transit: 'text-purple-600',
    out_for_delivery: 'text-orange-600',
    delivered: 'text-green-600',
    failed: 'text-red-600',
  };
  return map[status] || 'text-gray-500';
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
    <div className="w-full py-5 md:px-10 px-5">
      <Breadcrumbs />
      <h1 className="text-3xl mt-2">Profile</h1>
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-4">
        <ProfileQuickLinks />
        
        <div className="md:col-span-3 flex flex-col gap-6 w-full mt-4">
          
          {/* Header */}
          <div className="mb-2">
            <Link href="/home/profile/dashboard" className="text-sm text-primary hover:underline transition-colors inline-flex items-center gap-2 mb-4">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-black">
              Jejak Penghantaran
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Masukkan nombor penjejakan untuk semak status parcel anda.</p>
          </div>

          {/* Search Box */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-3">
              <input
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByTracking()}
                placeholder="cth: EPI12345678MY, JT123456789MY..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={() => searchByTracking()}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
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
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          {/* Delivered Celebration */}
          {isDelivered && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-green-700 mb-1">Parcel Telah Dihantar!</h2>
              <p className="text-green-600 text-sm">Terima kasih kerana menggunakan perkhidmatan Kampung Cetak!</p>
            </div>
          )}

          {/* Failed Notice */}
          {isFailed && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <h2 className="text-base font-bold text-red-700 mb-1">❌ Penghantaran Gagal</h2>
              <p className="text-red-600 text-sm">
                Kurier tidak dapat menghantar parcel. Sila hubungi kami melalui WhatsApp untuk bantuan.
              </p>
            </div>
          )}

          {/* Tracking Result */}
          {parcel && (
            <div className="space-y-5">

              {/* Info Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">No. Penjejakan</div>
                    <div className="text-lg font-bold font-mono text-black">{parcel.trackingNumber}</div>
                    <div className="text-sm text-gray-500 mt-1">Kurier: <span className="text-black font-medium">{parcel.courier}</span></div>
                    {parcel.orderId && (
                      <div className="text-sm text-gray-500">Order: <span className="text-black font-medium">{parcel.orderId}</span></div>
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
                  <div className="relative mt-8">
                    <div className="flex items-center justify-between relative">
                      {/* connector line */}
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
                      <div
                        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-700 -z-0"
                        style={{ width: `${Math.min(stepIndex / (STEPS.length - 1), 1) * 100}%` }}
                      />

                      {STEPS.map((step, i) => {
                        const done = i < stepIndex;
                        const current = i === stepIndex;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 border-2 bg-white
                              ${done
                                ? 'border-primary text-primary'
                                : current
                                  ? 'border-primary text-primary animate-pulse'
                                  : 'border-gray-200 text-gray-400'
                              }
                            `}>
                              {step.icon}
                            </div>
                            <div className={`text-center text-xs font-medium max-w-16 leading-tight
                              ${done || current ? 'text-black' : 'text-gray-400'}
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
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-black">📋 Sejarah Penjejakan</h3>
                  <div className="space-y-1">
                    {parcel.events.slice().reverse().map((ev, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-primary animate-pulse' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${i === 0 ? 'text-black' : 'text-gray-600'}`}>
                              {ev.status || ev.description}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(ev.timestamp)}</p>
                          </div>
                          <span className="text-gray-400 text-xs">{expandedEvent === i ? '▲' : '▼'}</span>
                        </button>
                        {expandedEvent === i && (
                          <div className="ml-8 px-3 pb-3 text-sm text-gray-500 space-y-1">
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
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                  <div className="text-3xl mb-3">📡</div>
                  <p className="text-gray-500 text-sm">Tiada rekod penjejakan lagi. Sila semak semula sebentar lagi.</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!parcel && !loading && !error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600 text-base font-medium">Masukkan nombor penjejakan anda di atas</p>
              <p className="text-gray-400 text-sm mt-2">Nombor penjejakan boleh didapati dalam emel pengesahan pesanan anda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
