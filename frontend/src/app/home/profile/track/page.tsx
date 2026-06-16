'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from "@/components/global/breadcrumb";
import ProfileQuickLinks from "@/components/page-sections/profile/profileQuickLinks";
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

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
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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

  // Dummy coordinate for map (Kuala Lumpur center)
  const mapCenter = { lat: 3.1478, lng: 101.6953 };

  return (
    <div className="w-full py-5 md:px-10 px-5">
      <Breadcrumbs />
      <h1 className="text-3xl mt-2 font-bold tracking-tight">Profile</h1>
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
            <p className="text-gray-500 mt-2 text-sm">Masukkan nombor penjejakan EasyParcel untuk semak status parcel anda dalam masa nyata.</p>
          </div>

          {/* Search Box - Modern Redesign */}
          <div className="bg-white border border-gray-200 rounded-3xl p-3 shadow-sm flex items-center">
            <div className="pl-4 pr-2 text-gray-400">📦</div>
            <input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchByTracking()}
              placeholder="Contoh: EPI12345678MY, JT123456789MY..."
              className="flex-1 bg-transparent px-2 py-3 text-sm text-black placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => searchByTracking()}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : '🔍'}
              {loading ? 'Mencari...' : 'Jejak'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600 flex items-center gap-3 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Tracking Result */}
          {parcel && (
            <div className="flex flex-col gap-6">

              {/* Status & Map Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Info & Stepper */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">EasyParcel Tracking</div>
                        <div className="text-xl font-black font-mono text-black">{parcel.trackingNumber}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Kurier:</span>
                        <span className="text-black font-bold uppercase">{parcel.courier}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Status Terkini:</span>
                        <span className={`font-bold ${statusColor(parcel.status)}`}>{statusLabel(parcel.status)}</span>
                      </div>
                      {parcel.orderId && (
                        <>
                          <div className="w-full h-px bg-gray-200" />
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Pesanan:</span>
                            <span className="text-black font-bold">{parcel.orderId}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Stepper */}
                  {!isFailed && (
                    <div className="relative mt-4 mb-2 px-2">
                      <div className="flex items-center justify-between relative">
                        {/* connector line */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 rounded-full -z-0" />
                        <div
                          className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-1000 ease-out -z-0"
                          style={{ width: `${Math.min(stepIndex / (STEPS.length - 1), 1) * 100}%` }}
                        />

                        {STEPS.map((step, i) => {
                          const done = i < stepIndex;
                          const current = i === stepIndex;
                          return (
                            <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 group">
                              <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                                ${done
                                  ? 'bg-primary text-white scale-100'
                                  : current
                                    ? 'bg-primary text-white scale-110 ring-4 ring-primary/20 animate-pulse'
                                    : 'bg-white border-2 border-gray-200 text-gray-300 scale-90'
                                }
                              `}>
                                {step.icon}
                              </div>
                              <div className={`absolute top-10 text-center text-[10px] font-bold max-w-16 leading-tight whitespace-nowrap
                                ${done || current ? 'text-black' : 'text-gray-400'}
                              `}>
                                {step.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-6" /> {/* spacer for absolute text */}
                    </div>
                  )}

                  {isFailed && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
                      <h2 className="text-sm font-bold text-red-700 mb-1">❌ Penghantaran Gagal</h2>
                      <p className="text-red-600 text-xs">
                        Kurier tidak dapat menghantar parcel. Sila hubungi khidmat pelanggan.
                      </p>
                    </div>
                  )}
                  {isDelivered && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4 text-center">
                      <h2 className="text-sm font-bold text-green-700">🎉 Parcel Telah Dihantar!</h2>
                    </div>
                  )}
                </div>

                {/* Right Column: Google Maps */}
                <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-sm h-[350px] lg:h-auto border border-gray-200 relative">
                  {GOOGLE_MAPS_API_KEY ? (
                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                      <Map
                        defaultZoom={12}
                        defaultCenter={mapCenter}
                        mapId="DEMO_MAP_ID"
                        disableDefaultUI={true}
                      >
                        <AdvancedMarker position={mapCenter}>
                          <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'#fff'} />
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                      <div className="text-5xl mb-4">🗺️</div>
                      <p className="font-bold text-gray-800 mb-1">Live Map Integrasi</p>
                      <p className="text-xs text-gray-500 max-w-xs">Peta akan dipaparkan di sini apabila Google Maps API Key dimasukkan.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Tracking History */}
              {parcel.events && parcel.events.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-black mb-6 text-black flex items-center gap-2">
                    <span>📋</span> Sejarah Pergerakan
                  </h3>
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {parcel.events.slice().reverse().map((ev, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline dot */}
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10
                          ${i === 0 ? 'bg-primary' : 'bg-gray-300'}
                        `}>
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white animate-pulse' : 'bg-transparent'}`} />
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm mb-4 group-hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-gray-800'}`}>{ev.status || ev.description}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2 font-medium bg-gray-50 inline-block px-2 py-1 rounded-md">{formatDate(ev.timestamp)}</div>
                          {ev.description && <p className="text-sm text-gray-600 mt-1">📝 {ev.description}</p>}
                          {ev.location && <p className="text-sm text-gray-600 mt-1">📍 {ev.location}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No events */}
              {(!parcel.events || parcel.events.length === 0) && (
                <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-sm">
                  <div className="text-4xl mb-4">📡</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Tiada Rekod Penjejakan</h3>
                  <p className="text-gray-500 text-sm">Data EasyParcel belum dikemaskini. Sila semak semula sebentar lagi.</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!parcel && !loading && !error && (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 border-dashed rounded-3xl mt-4">
              <div className="text-5xl mb-4 opacity-50">📦</div>
              <p className="text-gray-800 text-lg font-bold">Semak Status Bungkusan Anda</p>
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">Masukkan nombor penjejakan EasyParcel yang diberikan dalam emel pengesahan untuk menjejak pesanan anda.</p>
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
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
