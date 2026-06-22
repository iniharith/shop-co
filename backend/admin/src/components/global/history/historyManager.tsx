"use client";
import React, { useState, useMemo } from "react";
import { DataTableSkeleton } from "../table/data-table-skeleton";
import { useOrders } from "@/hooks/useOrder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "../../table/orders/OrderCard";
import { Search, PackageX, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HistoryManager = () => {
  const { data, isPending, refetch, isFetching } = useOrders();
  const [activeTab, setActiveTab] = useState("DONE");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    let orders = data?.orders || [];
    
    if (activeTab === "DONE") {
      orders = orders.filter((o: any) => o.orderStatus === "DELIVERED" || o.orderStatus === "DONE DESIGN" || o.orderStatus === "SHIPPED");
    } else if (activeTab === "CANCELLED") {
      orders = orders.filter((o: any) => o.orderStatus === "CANCELLED" || o.orderStatus === "FAILED");
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      orders = orders.filter((o: any) => 
        o.trackingNumber?.toLowerCase().includes(lowerQuery) ||
        o.customerName?.toLowerCase().includes(lowerQuery) ||
        o.userId?.name?.toLowerCase().includes(lowerQuery) ||
        o.userId?.email?.toLowerCase().includes(lowerQuery) ||
        o._id?.toLowerCase().includes(lowerQuery)
      );
    }
    
    return orders;
  }, [data, activeTab, searchQuery]);

  if (isPending) return <DataTableSkeleton />;

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="flex h-auto gap-2 justify-start bg-muted/20 p-1 rounded-xl">
              <TabsTrigger value="DONE" className="rounded-lg">Done / Completed</TabsTrigger>
              <TabsTrigger value="CANCELLED" className="rounded-lg text-red-500 data-[state=active]:bg-red-500 data-[state=active]:text-white">Cancelled / Failed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search history by Tracking No, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl bg-background border-border"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="rounded-xl h-10 w-10 shadow-sm border-border shrink-0" title="Refresh History">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-dashed border-border/60">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <PackageX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-foreground">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              We couldn't find any orders in this history view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10">
            {filteredOrders.map((order: any) => (
              <div key={order._id} className={activeTab === "CANCELLED" ? "border-2 border-red-500 bg-red-50 rounded-2xl p-2 relative overflow-hidden" : ""}>
                {activeTab === "CANCELLED" && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                    CANCELLED
                  </div>
                )}
                <div className={activeTab === "CANCELLED" ? "[&_*]:text-red-900" : ""}>
                  <OrderCard order={order} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default HistoryManager;
