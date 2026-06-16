"use client";
import React from "react";
import { DataTable } from "../../global/data-table";
import { columns } from "./columns";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useParcels } from "@/hooks/useAdminDashboard";

export default function TrackingList() {
  const { data: response, isPending } = useParcels();

  if (isPending) return <DataTableSkeleton />;

  const parcels = response?.data || [];
  
  return <DataTable search={"trackingNumber"} data={parcels} columns={columns} />;
}
