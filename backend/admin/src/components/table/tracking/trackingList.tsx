"use client";
import React from "react";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useParcels } from "@/hooks/useAdminDashboard";
import TrackingCard from "./TrackingCard";
import { PackageX } from "lucide-react";

export default function TrackingList() {
  const { data: response, isPending } = useParcels();

  if (isPending) return <DataTableSkeleton />;

  const parcels = response?.data || [];
  
  if (parcels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <PackageX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-900">No Parcels Found</h3>
        <p className="text-slate-500 text-sm mt-1">There are no active shipments to track right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {parcels.map((parcel: any) => (
        <TrackingCard key={parcel._id} parcel={parcel} />
      ))}
    </div>
  );
}
