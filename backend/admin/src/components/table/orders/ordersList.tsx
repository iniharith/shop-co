"use client";
import React, { useState, useMemo } from "react";
import { DataTable } from "../../global/data-table";
import { orderColumns as columns } from "./columns";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useOrders } from "@/hooks/useOrder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {}

const OrdersList = (props: Props) => {
  const { data, isPending } = useOrders();
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredOrders = useMemo(() => {
    const orders = data?.orders || [];
    if (activeTab === "ALL") return orders;
    return orders.filter((o: any) => (o.platform || "WEB") === activeTab);
  }, [data, activeTab]);

  if (isPending) return <DataTableSkeleton />;

  if (data) {
    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto gap-2 justify-start mb-4 bg-muted/20">
            <TabsTrigger value="ALL">All Orders</TabsTrigger>
            <TabsTrigger value="WEB">KampungCetak (Web)</TabsTrigger>
            <TabsTrigger value="TIKTOK">TikTok Shop</TabsTrigger>
            <TabsTrigger value="SHOPEE">Shopee</TabsTrigger>
          </TabsList>
        </Tabs>
        <DataTable search={"orderId"} data={filteredOrders} columns={columns} />
      </div>
    );
  }
  return null;
};

export default OrdersList;
