"use client";
import React, { useState, useMemo } from "react";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useParcels } from "@/hooks/useAdminDashboard";
import TrackingCard from "./TrackingCard";
import { PackageX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrackingList() {
  const { data: response, isPending } = useParcels();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("All");

  const parcels = (response as any)?.data || [];

  const couriers = ["All", ...Array.from(new Set(parcels.map((p: any) => p.courier).filter(Boolean)))];

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel: any) => {
      const matchesSearch = 
        parcel.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCourier = selectedCourier === "All" || parcel.courier === selectedCourier;

      return matchesSearch && matchesCourier;
    });
  }, [parcels, searchQuery, selectedCourier]);

  if (isPending) return <DataTableSkeleton />;

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
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by tracking number or customer..." 
            className="pl-9 bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={selectedCourier} onValueChange={setSelectedCourier} className="w-full md:w-auto overflow-x-auto">
          <TabsList className="inline-flex w-full md:w-auto h-10 items-center justify-start rounded-xl bg-slate-50 p-1 text-slate-500 overflow-x-auto whitespace-nowrap">
            {couriers.map((courier: any) => (
              <TabsTrigger 
                key={courier as string} 
                value={courier as string} 
                className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {courier as string}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredParcels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredParcels.map((parcel: any) => (
            <TrackingCard key={parcel._id} parcel={parcel} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm border-dashed">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">No results found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or courier filter.</p>
        </div>
      )}
    </div>
  );
}
