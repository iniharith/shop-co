/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useOrders } from "@/hooks/useOrder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResponsiveVirtualizedOrderList from "./ResponsiveVirtualizedOrderList";
import { Search, PackageX, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SavedViewsControl from "@/components/global/SavedViewsControl";

type OrderSavedView = { activeTab: string; searchQuery: string };
const ORDER_TABS = ["ALL", "WEB", "TIKTOK", "SHOPEE"];
const isOrderSavedView = (value: unknown): value is OrderSavedView => {
  if (!value || typeof value !== "object") return false;
  const view = value as OrderSavedView;
  return ORDER_TABS.includes(view.activeTab) && typeof view.searchQuery === "string";
};

interface Props {
  scrollParent: HTMLElement | null;
}

const OrdersList = ({ scrollParent }: Props) => {
  const urlSearchQuery = useSearchParams().get("search") || "";
  const { data, isPending, refetch, isFetching } = useOrders();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const lastAppliedUrlSearch = useRef(urlSearchQuery);

  useEffect(() => {
    if (urlSearchQuery === lastAppliedUrlSearch.current) return;
    lastAppliedUrlSearch.current = urlSearchQuery;
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const filteredOrders = useMemo(() => {
    let orders = data?.orders || [];
    
    // Keep the default view active-only, but allow direct search links to find historical orders.
    if (!searchQuery.trim()) {
      const excludeStatuses = ["DELIVERED", "DONE_DESIGN", "CANCELLED", "FAILED"];
      orders = orders.filter((o: any) => !excludeStatuses.includes(o.orderStatus) && !o.isArchived);
    }

    // Filter by platform
    if (activeTab !== "ALL") {
      orders = orders.filter((o: any) => (o.platform || "WEB") === activeTab);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      orders = orders.filter((o: any) => 
        o.trackingNumber?.toLowerCase().includes(lowerQuery) ||
        o.customerName?.toLowerCase().includes(lowerQuery) ||
        o.shippingCustomerEmail?.toLowerCase().includes(lowerQuery) ||
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
              <TabsTrigger value="ALL" className="rounded-lg">All Orders</TabsTrigger>
              <TabsTrigger value="WEB" className="rounded-lg">KampungCetak (Web)</TabsTrigger>
              <TabsTrigger value="TIKTOK" className="rounded-lg">TikTok Shop</TabsTrigger>
              <TabsTrigger value="SHOPEE" className="rounded-lg">Shopee</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Tracking No, ID, or Customer..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl bg-background border-border"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="rounded-xl h-10 w-10 shadow-sm border-border shrink-0" title="Refresh Orders">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <SavedViewsControl
              scope="orders"
              state={{ activeTab, searchQuery }}
              isValidState={isOrderSavedView}
              onApply={view => {
                setActiveTab(view.activeTab);
                setSearchQuery(view.searchQuery);
              }}
              className="h-10 rounded-xl gap-2 shrink-0"
            />
          </div>
        </div>
        
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
          <ResponsiveVirtualizedOrderList orders={filteredOrders} scrollParent={scrollParent} />
        )}
      </div>
    );
  }
  return null;
};

export default OrdersList;
