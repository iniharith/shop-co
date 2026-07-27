/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import { useDashboardSummary } from "@/hooks/useAdminDashboard";
import { Archive, Box, CircleAlert, CircleCheckBig, ClipboardList, FileText, FolderOpen, Layers, Package, RefreshCw, Truck, Users } from "lucide-react";
import LoadingAnimation from "@/components/global/LoadingAnimation";

export default function DashboardOverview() {
  const { data: summary, isPending, refetch, isFetching } = useDashboardSummary();

  const handleRefresh = () => {
    refetch();
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingAnimation fullScreen={false} label="Loading dashboard" />
      </div>
    );
  }

  const data = (summary as any)?.data || {};

  const totalOrders = data.orders?.total || 0;

  const parcelData = data.parcels || { total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 };
  const fileData = data.files || { totalFiles: 0, totalSize: 0, pendingReview: 0 };

  const totalTasks = data.tasks?.total || 0;
  const totalFolders = data.folders?.total || 0;
  const onlineUsers = data.onlineUsers?.count || 0;
  const activeDeliveries = (parcelData.in_transit || 0) + (parcelData.pending || 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const deliveryProgress = parcelData.total > 0 
    ? ((parcelData.delivered / parcelData.total) * 100).toFixed(0) 
    : 0;

  return (
    <section className="relative isolate overflow-hidden rounded-[36px] border border-slate-200/70 bg-slate-100 p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950 sm:p-5">
      <div className="pointer-events-none absolute -left-20 top-20 -z-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">Live operations</p>
          <p className="mt-1 text-sm text-muted-foreground">A current view across orders, delivery, and artwork.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-950/10 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-50 shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-100 dark:text-slate-950 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:auto-rows-[minmax(132px,auto)]">
        <article className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-6 text-slate-50 shadow-xl shadow-slate-950/15 sm:col-span-2 sm:p-8 xl:col-span-8 xl:row-span-2">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-blue-500/25" />
          <div className="pointer-events-none absolute bottom-8 right-8 h-20 w-20 rotate-12 rounded-[24px] bg-blue-500/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-blue-50">
                <Box className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-300">Total Orders</span>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">All time</span>
          </div>
          <div className="relative z-10 mt-10">
            <div className="font-display text-6xl font-bold tracking-[-0.06em] sm:text-7xl">{totalOrders}</div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(190,242,100,0.8)]" />
              Lifetime orders placed
            </div>
          </div>
        </article>

        <article className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[32px] border border-lime-400/70 bg-lime-300 p-6 text-slate-950 shadow-xl shadow-lime-500/10 sm:col-span-2 sm:p-7 xl:col-span-4 xl:row-span-2">
          <div className="pointer-events-none absolute -right-12 top-14 h-36 w-36 rounded-full border-[28px] border-slate-950/5" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">Delivery health</p>
              <h3 className="mt-1 text-lg font-bold">Success Rate</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-lime-300">
              <Truck className="h-5 w-5" />
            </span>
          </div>
          <div className="relative z-10 mt-8">
            <div className="font-display text-6xl font-bold tracking-[-0.06em]">
              {deliveryProgress}<span className="ml-1 text-2xl tracking-normal text-slate-600">%</span>
            </div>
            <div
              className="mt-6 h-3 overflow-hidden rounded-full bg-slate-950/15"
              role="progressbar"
              aria-label="Delivery success rate"
              aria-valuenow={Number(deliveryProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-slate-950 transition-all duration-1000 ease-out" style={{ width: `${deliveryProgress}%` }} />
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs font-semibold text-slate-700">
              <span>{parcelData.delivered} delivered</span>
              <span>{parcelData.total} total parcels</span>
            </div>
          </div>
        </article>

        <article className="flex min-h-32 flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 xl:col-span-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Deliveries</span>
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="font-display text-3xl font-bold tracking-tight text-foreground">{activeDeliveries}</div>
        </article>

        <article className="flex min-h-32 flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 xl:col-span-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Tasks</span>
            <ClipboardList className="h-4 w-4 text-violet-500" />
          </div>
          <div className="font-display text-3xl font-bold tracking-tight text-foreground">{totalTasks}</div>
        </article>

        <article className="flex min-h-32 flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 xl:col-span-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Folders</span>
            <FolderOpen className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-display text-3xl font-bold tracking-tight text-foreground">{totalFolders}</div>
        </article>

        <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-[28px] border border-emerald-200/80 bg-emerald-50 p-5 shadow-[0_18px_50px_-36px_rgba(16,185,129,0.45)] dark:border-emerald-400/20 dark:bg-emerald-950 xl:col-span-3">
          <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-emerald-400/15 blur-xl" />
          <div className="relative flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-xs font-semibold">Users Online</span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </span>
          </div>
          <div className="relative font-display text-3xl font-bold tracking-tight text-foreground">{onlineUsers}</div>
        </article>

        <article className="rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.45)] sm:col-span-2 sm:p-7 dark:border-white/10 dark:bg-slate-900 xl:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Parcel flow</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">Delivery Status</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">{parcelData.total} parcels</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[28px] bg-emerald-50/90 p-4 dark:bg-emerald-400/10">
              <CircleCheckBig className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div className="mt-6 text-2xl font-bold text-foreground">{parcelData.delivered || 0}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Delivered</div>
            </div>
            <div className="rounded-[28px] bg-blue-50/90 p-4 dark:bg-blue-400/10">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="mt-6 text-2xl font-bold text-foreground">{parcelData.in_transit || 0}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">In Transit</div>
            </div>
            <div className="rounded-[28px] bg-amber-50/90 p-4 dark:bg-amber-400/10">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="mt-6 text-2xl font-bold text-foreground">{parcelData.pending || 0}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-[28px] bg-rose-50/90 p-4 dark:bg-rose-400/10">
              <CircleAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <div className="mt-6 text-2xl font-bold text-foreground">{parcelData.failed || 0}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Failed</div>
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[32px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-[0_20px_60px_-38px_rgba(37,99,235,0.5)] sm:col-span-2 sm:p-7 dark:border-blue-400/20 dark:from-blue-950 dark:via-slate-950 dark:to-cyan-950 xl:col-span-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[26px] border-blue-500/10" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Artwork analytics</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">Files Managed</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-blue-50">
              <FileText className="h-5 w-5" />
            </span>
          </div>
          <div className="relative z-10 my-7 font-display text-6xl font-bold tracking-[-0.06em] text-foreground">{fileData.totalFiles}</div>
          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-[28px] border border-blue-100/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-center gap-3">
                <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-muted-foreground">Storage Used</span>
              </div>
              <span className="text-sm font-bold text-foreground">{formatBytes(fileData.totalSize || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-[28px] border border-blue-100/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-semibold text-muted-foreground">Pending Review</span>
              </div>
              <span className="text-sm font-bold text-foreground">{fileData.pendingReview || 0}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
