/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import { DataTable } from "../../global/data-table";
import { deliveryBoyColumns as columns } from "./columns";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useUsers } from "@/hooks/useUsers";

interface Props {}

const DeliveryBoysList = (props: Props) => {
  // Showcasing the use of search params cache in nested RSCs

  const { data, isPending } = useUsers();

  if (isPending) return <DataTableSkeleton />;

  if (data) {
    const deliveryBoys = (data as any).deliveryBoys || [];
    return <DataTable search={"name"} data={deliveryBoys} columns={columns} />;
  }
  return null;
};

export default DeliveryBoysList;
