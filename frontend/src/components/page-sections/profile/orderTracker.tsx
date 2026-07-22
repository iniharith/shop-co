/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

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
  { key: "pending", label: "Menunggu", icon: "⏳" },
  { key: "picked_up", label: "Dikutip", icon: "📦" },
  { key: "in_transit", label: "Dalam Transit", icon: "🚚" },
  { key: "out_for_delivery", label: "Dalam Penghantaran", icon: "🛵" },
  { key: "delivered", label: "Dihantar", icon: "✅" },
];

function getStepIndex(status: string) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function OrderTracker({ orderId }: { orderId: string }) {
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchParcel() {
      try {
        const res = await fetch(`${API}/api/parcels`, { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        // Normally we'd filter by orderId exactly, but since this is mock data and orders/parcels
        // might not be exactly 1-to-1 mapped in the current DB, we just take the first parcel
        // or one matching the orderId if available.
        const found = data.data.find((p: ParcelData) => p.orderId === orderId) || data.data[0];
        
        if (!found) {
          setError("Tiada rekod penghantaran untuk pesanan ini.");
        } else {
          setParcel(found);
        }
      } catch (e: any) {
        setError(e.message || "Gagal memuatkan status penghantaran.");
      } finally {
        setLoading(false);
      }
    }
    fetchParcel();
  }, [orderId]);

  if (loading) {
    return (
      <div className="w-full py-10 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <span className="text-sm text-gray-500">Mencari rekod penghantaran...</span>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
        <div className="text-3xl mb-2">📡</div>
        <h3 className="text-sm font-bold text-red-800 mb-1">{error || "Tiada data"}</h3>
        <p className="text-red-600 text-xs">Sila semak semula sebentar lagi.</p>
      </div>
    );
  }

  const stepIndex = getStepIndex(parcel.status);
  const isFailed = parcel.status === "failed";
  const mapCenter = { lat: 3.1478, lng: 101.6953 };

  return (
    <div className="bg-muted/50 rounded-2xl p-4 md:p-6 border border-border shadow-inner mt-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">EasyParcel Tracking</div>
          <div className="text-lg font-black font-mono text-foreground">{parcel.trackingNumber}</div>
        </div>
        <div className="bg-card px-4 py-2 rounded-xl border border-border text-sm flex gap-4">
          <div>
            <span className="text-muted-foreground">Kurier:</span>{" "}
            <span className="font-bold uppercase">{parcel.courier}</span>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      {!isFailed && (
        <div className="relative mt-4 mb-10 px-2 md:px-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full -z-0" />
            <div
              className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-1000 ease-out -z-0"
              style={{ width: `${Math.min(stepIndex / (STEPS.length - 1), 1) * 100}%` }}
            />

            {STEPS.map((step, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 group">
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                    ${
                      done
                        ? "bg-primary text-primary-foreground scale-100"
                        : current
                        ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 animate-pulse"
                        : "bg-card border-2 border-border text-muted-foreground scale-90"
                    }
                  `}
                  >
                    {step.icon}
                  </div>
                  <div
                    className={`absolute top-10 text-center text-[10px] md:text-xs font-bold max-w-16 md:max-w-none leading-tight whitespace-nowrap
                    ${done || current ? "text-foreground" : "text-muted-foreground"}
                  `}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split Map and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Timeline */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-bold mb-4 text-foreground flex items-center gap-2">
            <span>📋</span> Sejarah Pergerakan
          </h3>
          <div className="max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            {parcel.events && parcel.events.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
                {parcel.events.slice().reverse().map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div
                       className={`flex-shrink-0 flex items-center justify-center w-6 h-6 mt-1 rounded-full border-4 border-card shadow-sm z-10
                      ${i === 0 ? "bg-primary" : "bg-gray-300"}
                    `}
                    />
                    <div className="flex-1 bg-muted/50 rounded-xl p-3 border border-border">
                      <div className="font-bold text-sm text-foreground">{ev.status || ev.description}</div>
                      <div className="text-[11px] text-muted-foreground font-medium my-1">{formatDate(ev.timestamp)}</div>
                      {ev.location && <div className="text-xs text-muted-foreground mt-1">📍 {ev.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic">Tiada rekod lagi.</p>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="bg-muted rounded-2xl overflow-hidden border border-border h-[300px] relative">
          {GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map defaultZoom={12} defaultCenter={mapCenter} mapId="DEMO_MAP_ID" disableDefaultUI={true}>
                <AdvancedMarker position={mapCenter}>
                  <Pin background={"#ef4444"} borderColor={"#b91c1c"} glyphColor={"#fff"} />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="font-bold text-foreground text-sm mb-1">Live Map Integrasi</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Sila masukkan Google Maps API Key dalam file .env
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
