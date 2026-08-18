"use client";
import React from "react";
import { useDashboardSummary } from "@/hooks/useAdminDashboard";
import { Archive, Box, CircleAlert, CircleCheckBig, ClipboardList, FileText, FolderOpen, Layers, Package, RefreshCw, Truck, Users } from "lucide-react";
import LoadingAnimation from "@/components/global/LoadingAnimation";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DashboardOverview() {
  const { data: summary, isPending, refetch, isFetching } = useDashboardSummary();
  const { t } = useLanguage();

  const handleRefresh = () => {
    refetch();
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingAnimation fullScreen={false} label={t("dashboard.loading")} />
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
    <section className="rounded-[28px] border border-white/10 bg-card/40 backdrop-blur-md p-6 shadow-xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">{t("dashboard.liveOps")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("dashboard.liveOpsDesc")}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("dashboard.refresh")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        {/* Total Orders — hero card */}
        <article className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] bg-card/40 border border-white/10 p-6 sm:col-span-2 sm:p-8 xl:col-span-8 xl:row-span-2">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-blue-500/15" />
          <div className="pointer-events-none absolute bottom-8 right-8 h-20 w-20 rotate-12 rounded-[24px] bg-blue-500/10" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                <Box className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-gray-400">{t("dashboard.totalOrders")}</span>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">{t("dashboard.allTime")}</span>
          </div>
          <div className="relative z-10 mt-10">
            <div className="text-6xl font-bold tracking-tight sm:text-7xl">{totalOrders}</div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
              {t("dashboard.lifetimeOrders")}
            </div>
          </div>
        </article>

        {/* Delivery Health */}
        <article className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] bg-green-500/10 border border-green-500/20 p-6 sm:col-span-2 sm:p-7 xl:col-span-4 xl:row-span-2">
          <div className="pointer-events-none absolute -right-12 top-14 h-36 w-36 rounded-full border-[28px] border-green-500/10" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-500/70">{t("dashboard.deliveryHealth")}</p>
              <h3 className="mt-1 text-lg font-bold text-green-400">{t("dashboard.successRate")}</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/15 text-green-400">
              <Truck className="h-5 w-5" />
            </span>
          </div>
          <div className="relative z-10 mt-8">
            <div className="text-6xl font-bold tracking-tight text-green-400">
              {deliveryProgress}<span className="ml-1 text-2xl tracking-normal text-green-500/60">%</span>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-green-500/15">
              <div className="h-full rounded-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${deliveryProgress}%` }} />
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs font-semibold text-green-500/70">
              <span>{parcelData.delivered} {t("dashboard.delivered").toLowerCase()}</span>
              <span>{parcelData.total} {t("dashboard.totalParcels")}</span>
            </div>
          </div>
        </article>

        {/* Active Deliveries */}
        <article className="flex min-h-[120px] flex-col justify-between rounded-[28px] bg-card/40 border border-white/10 p-5 xl:col-span-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">{t("dashboard.activeDeliveries")}</span>
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight">{activeDeliveries}</div>
        </article>

        {/* Total Tasks */}
        <article className="flex min-h-[120px] flex-col justify-between rounded-[28px] bg-card/40 border border-white/10 p-5 xl:col-span-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">{t("dashboard.totalTasks")}</span>
            <ClipboardList className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight">{totalTasks}</div>
        </article>

        {/* Total Folders */}
        <article className="flex min-h-[120px] flex-col justify-between rounded-[28px] bg-card/40 border border-white/10 p-5 xl:col-span-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">{t("dashboard.totalFolders")}</span>
            <FolderOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight">{totalFolders}</div>
        </article>

        {/* Users Online */}
        <article className="relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 p-5 xl:col-span-3">
          <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-xl" />
          <div className="relative flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">{t("dashboard.usersOnline")}</span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </span>
          </div>
          <div className="relative text-3xl font-bold tracking-tight">{onlineUsers}</div>
        </article>

        {/* Parcel Flow */}
        <article className="rounded-[28px] bg-card/40 border border-white/10 p-5 sm:col-span-2 sm:p-7 xl:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{t("dashboard.parcelFlow")}</p>
              <h3 className="mt-1 text-lg font-bold">{t("dashboard.deliveryStatus")}</h3>
            </div>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">{parcelData.total} {t("dashboard.parcels")}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[20px] bg-green-500/10 p-4">
              <CircleCheckBig className="h-5 w-5 text-green-400" />
              <div className="mt-4 text-2xl font-bold">{parcelData.delivered || 0}</div>
              <div className="mt-1 text-xs font-medium text-gray-500">{t("dashboard.delivered")}</div>
            </div>
            <div className="rounded-[20px] bg-blue-500/10 p-4">
              <Truck className="h-5 w-5 text-blue-400" />
              <div className="mt-4 text-2xl font-bold">{parcelData.in_transit || 0}</div>
              <div className="mt-1 text-xs font-medium text-gray-500">{t("dashboard.inTransit")}</div>
            </div>
            <div className="rounded-[20px] bg-amber-500/10 p-4">
              <Package className="h-5 w-5 text-amber-400" />
              <div className="mt-4 text-2xl font-bold">{parcelData.pending || 0}</div>
              <div className="mt-1 text-xs font-medium text-gray-500">{t("dashboard.pending")}</div>
            </div>
            <div className="rounded-[20px] bg-red-500/10 p-4">
              <CircleAlert className="h-5 w-5 text-red-400" />
              <div className="mt-4 text-2xl font-bold">{parcelData.failed || 0}</div>
              <div className="mt-1 text-xs font-medium text-gray-500">{t("dashboard.failed")}</div>
            </div>
          </div>
        </article>

        {/* Artwork Analytics */}
        <article className="relative overflow-hidden rounded-[28px] bg-card/40 border border-white/10 p-5 sm:col-span-2 sm:p-7 xl:col-span-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[26px] border-blue-500/10" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">{t("dashboard.artworkAnalytics")}</p>
              <h3 className="mt-1 text-lg font-bold">{t("dashboard.filesManaged")}</h3>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
              <FileText className="h-5 w-5" />
            </span>
          </div>
          <div className="relative z-10 my-7 text-6xl font-bold tracking-tight">{fileData.totalFiles}</div>
          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Archive className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-gray-500">{t("dashboard.storageUsed")}</span>
              </div>
              <span className="text-sm font-bold">{formatBytes(fileData.totalSize || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-semibold text-gray-500">{t("dashboard.pendingReview")}</span>
              </div>
              <span className="text-sm font-bold">{fileData.pendingReview || 0}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
