"use client";

import React, { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTracking } from "@/api/order";
import { useSession } from "next-auth/react";

interface LiveTrackingProps {
  orderId: string;
  awb: string;
}

export const LiveTracking = ({ orderId, awb }: LiveTrackingProps) => {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !orderId) return;
    
      getTracking(token, orderId)
      .then((res) => {
        setTracking(res.parcel);
      })
      .catch((err) => {
        console.error("Failed to fetch tracking data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, token]);

  if (loading) {
    return (
      <Card className="p-6 mb-8 bg-muted-foreground/10 overflow-hidden">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Truck size={20} /> Loading EasyParcel Tracking...
        </h2>
      </Card>
    );
  }

  if (!tracking) {
    return null;
  }

  return (
    <Card className="p-6 mb-8 bg-muted-foreground/10 overflow-hidden">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Truck size={20} /> Live EasyParcel Tracking (AWB: {awb})
      </h2>
      <div className="space-y-4">
        {tracking.events?.map((event: any, i: number) => (
          <div key={i} className="flex gap-4 border-l-2 border-primary/30 pl-4 relative ml-2 pb-2">
            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
            <div>
              <p className="font-semibold text-sm">{event.description || event.status}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()} {event.location ? `- ${event.location}` : ""}
              </p>
            </div>
          </div>
        ))}
        {(!tracking.events || tracking.events.length === 0) && (
          <p className="text-sm text-muted-foreground">No tracking updates yet.</p>
        )}
      </div>
    </Card>
  );
};
