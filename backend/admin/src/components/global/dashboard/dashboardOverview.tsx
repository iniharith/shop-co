"use client";
import React from "react";
import { useParcelStats, useFileStats } from "@/hooks/useAdminDashboard";
import { useOrders } from "@/hooks/useOrder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOverview() {
  const { data: orderData, isPending: ordersPending, refetch: refetchOrders, isFetching: isFetchingOrders } = useOrders();
  const { data: parcelStats, isPending: parcelsPending, refetch: refetchParcels, isFetching: isFetchingParcels } = useParcelStats();
  const { data: fileStats, isPending: filesPending, refetch: refetchFiles, isFetching: isFetchingFiles } = useFileStats();

  const isFetching = isFetchingOrders || isFetchingParcels || isFetchingFiles;
  const handleRefresh = () => {
    refetchOrders();
    refetchParcels();
    refetchFiles();
  };

  if (ordersPending || parcelsPending || filesPending) {
    return <div className="flex justify-center p-8"><p>Loading dashboard...</p></div>;
  }

  const orders = orderData?.orders || [];
  const totalOrders = orders.length;

  const parcelData = (parcelStats as any)?.data || { total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 };
  const fileData = (fileStats as any)?.data || { totalFiles: 0, totalSize: 0, pendingReview: 0 };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex justify-end w-full mb-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Orders Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total orders placed
            </p>
          </CardContent>
        </Card>

        {/* Deliveries Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parcelData.in_transit + parcelData.pending}</div>
            <p className="text-xs text-muted-foreground">
              {parcelData.in_transit} in transit, {parcelData.pending} pending
            </p>
          </CardContent>
        </Card>

        {/* Artworks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artworks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileData.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {(fileData.totalSize / 1024 / 1024).toFixed(2)} MB total storage used
            </p>
          </CardContent>
        </Card>

        {/* Reviews Pending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileData.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Artworks needing review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Delivery Status Overview</CardTitle>
            <CardDescription>All parcels grouped by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><CircleCheckBig className="w-4 h-4 text-green-500"/> Delivered</span>
                <span className="font-semibold">{parcelData.delivered || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-500"/> In Transit</span>
                <span className="font-semibold">{parcelData.in_transit || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Box className="w-4 h-4 text-yellow-500"/> Pending</span>
                <span className="font-semibold">{parcelData.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><CircleAlert className="w-4 h-4 text-red-500"/> Failed</span>
                <span className="font-semibold">{parcelData.failed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Check the latest deliveries or artwork uploads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">More details coming soon or view directly in Tracking / Artworks pages.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
