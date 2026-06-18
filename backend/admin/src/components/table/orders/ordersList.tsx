"use client";
import React, { useState, useMemo } from "react";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useOrders } from "@/hooks/useOrder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "./OrderCard";
import { PackageX } from "lucide-react";

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
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto gap-2 justify-start mb-2 bg-muted/20 p-1 rounded-xl">
            <TabsTrigger value="ALL" className="rounded-lg">All Orders</TabsTrigger>
            <TabsTrigger value="WEB" className="rounded-lg">KampungCetak (Web)</TabsTrigger>
            <TabsTrigger value="TIKTOK" className="rounded-lg">TikTok Shop</TabsTrigger>
            <TabsTrigger value="SHOPEE" className="rounded-lg">Shopee</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-dashed border-border/60">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <PackageX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-foreground">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              We couldn't find any orders for the selected platform. They will appear here once placed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10">
            {filteredOrders.map((order: any) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default OrdersList;
