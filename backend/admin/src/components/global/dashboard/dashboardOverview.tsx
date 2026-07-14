/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import { useParcelStats, useFileStats, useOnlineUsers, useFolders } from "@/hooks/useAdminDashboard";
import { useOrders } from "@/hooks/useOrder";
import { useTasks } from "@/hooks/useTasks";
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, RefreshCw, Loader2, Package, Archive, Layers, Users, FolderOpen, ClipboardList } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardOverview() {
  const { data: orderData, isPending: ordersPending, refetch: refetchOrders, isFetching: isFetchingOrders } = useOrders();
  const { data: parcelStats, isPending: parcelsPending, refetch: refetchParcels, isFetching: isFetchingParcels } = useParcelStats();
  const { data: fileStats, isPending: filesPending, refetch: refetchFiles, isFetching: isFetchingFiles } = useFileStats();
  const { data: onlineData, refetch: refetchOnlineUsers } = useOnlineUsers();
  const { data: taskData, refetch: refetchTasks, isPending: tasksPending } = useTasks();
  const { data: folderData, refetch: refetchFolders, isPending: foldersPending } = useFolders();

  const isFetching = isFetchingOrders || isFetchingParcels || isFetchingFiles;
  const handleRefresh = () => {
    refetchOrders();
    refetchParcels();
    refetchFiles();
    refetchOnlineUsers();
    refetchTasks();
    refetchFolders();
  };

  if (ordersPending || parcelsPending || filesPending || tasksPending || foldersPending) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingSpinner size={44} />
      </div>
    );
  }

  const orders = orderData?.orders || [];
  const totalOrders = orders.length;

  const parcelData = (parcelStats as any)?.data || { total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 };
  const fileData = (fileStats as any)?.data || { totalFiles: 0, totalSize: 0, pendingReview: 0 };
  
  const totalTasks = (taskData as any)?.tasks?.length || 0;
  const totalFolders = (folderData as any)?.data?.length || 0;
  const onlineUsers = (onlineData as any)?.count || 0;
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-end w-full">
        <button 
          onClick={handleRefresh} 
          disabled={isFetching} 
          className="flex items-center gap-2 bg-[#242731] hover:bg-[#2A2E39] text-white px-4 py-2 rounded-xl transition-colors border border-white/5 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Orders Card */}
            <div className="bg-blue-500/10 backdrop-blur-md text-blue-400 p-6 rounded-[28px] flex flex-col justify-between relative overflow-hidden border border-blue-500/20 h-[220px]">
              <div className="flex justify-between items-center z-10 opacity-90">
                <div className="font-semibold text-sm">Total Orders</div>
                <Box className="w-5 h-5 opacity-70" />
              </div>
              <div className="text-6xl font-bold z-10 tracking-tighter mt-4 text-white">
                {totalOrders}
              </div>
              <div className="text-xs mt-4 z-10 font-medium opacity-80 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                Lifetime orders placed
              </div>
              
              {/* Decorative Graphic */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            </div>

            {/* Delivery Progress */}
            <div className="bg-card/40 backdrop-blur-md text-white p-6 rounded-[28px] border border-white/10 h-[220px] flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold text-gray-400">Delivery Success Rate</div>
                <Truck className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex justify-between items-end mb-4">
                <div className="text-5xl font-bold tracking-tight">
                  {deliveryProgress}
                  <span className="text-2xl font-semibold text-gray-500 ml-1">%</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${deliveryProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
                <span>{parcelData.delivered} delivered</span>
                <span>{parcelData.total} total parcels</span>
              </div>
            </div>
          </div>

          {/* New Requested Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/40 backdrop-blur-md p-4 rounded-[24px] border border-white/10 flex flex-col justify-center group hover:bg-card/60 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <div className="text-gray-400 text-xs font-semibold flex items-center gap-1.5"><Truck size={14}/> Active Deliveries</div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{activeDeliveries}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-4 rounded-[24px] border border-white/10 flex flex-col justify-center group hover:bg-card/60 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <div className="text-gray-400 text-xs font-semibold flex items-center gap-1.5"><ClipboardList size={14}/> Total Tasks</div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{totalTasks}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-4 rounded-[24px] border border-white/10 flex flex-col justify-center group hover:bg-card/60 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <div className="text-gray-400 text-xs font-semibold flex items-center gap-1.5"><FolderOpen size={14}/> Total Folders</div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{totalFolders}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-4 rounded-[24px] border border-green-500/20 flex flex-col justify-center group hover:bg-card/60 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-center mb-1 relative z-10">
                <div className="text-green-400/80 text-xs font-semibold flex items-center gap-1.5"><Users size={14}/> Users Online</div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight relative z-10">{onlineUsers}</div>
            </div>
          </div>

          {/* Delivery Status Overview (4 columns) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all cursor-default">
              <div className="flex items-center space-x-3 w-full mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <CircleCheckBig size={18} />
                </div>
                <div className="text-gray-400 font-medium text-sm">Delivered</div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{parcelData.delivered || 0}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all cursor-default">
              <div className="flex items-center space-x-3 w-full mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Truck size={18} />
                </div>
                <div className="text-gray-400 font-medium text-sm">In Transit</div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{parcelData.in_transit || 0}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all cursor-default">
              <div className="flex items-center space-x-3 w-full mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div className="text-gray-400 font-medium text-sm">Pending</div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{parcelData.pending || 0}</div>
            </div>

            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all cursor-default">
              <div className="flex items-center space-x-3 w-full mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <CircleAlert size={18} />
                </div>
                <div className="text-gray-400 font-medium text-sm">Failed</div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{parcelData.failed || 0}</div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Analytics */}
        <div className="bg-card/40 backdrop-blur-md rounded-[32px] p-8 border border-white/10 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-8">Artwork Analytics</h2>
          
          <div className="bg-background/40 backdrop-blur-sm rounded-3xl p-6 mb-8 relative overflow-hidden border border-white/5 flex-shrink-0">
            <div className="text-gray-400 text-sm mb-2 text-center font-medium relative z-10">Total Files Managed</div>
            <div className="text-6xl font-bold text-center text-white my-6 tracking-tighter relative z-10">
              {fileData.totalFiles}
            </div>
            <div className="flex justify-center mt-2 relative z-10">
              <span className="bg-[#064e3b] text-[#4ade80] px-4 py-1.5 rounded-full text-xs font-bold flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mr-2"></div> Uploaded
              </span>
            </div>
            
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="grid grid-cols-6 grid-rows-6 h-full w-full gap-2 p-2">
                 {Array.from({length: 36}).map((_, i) => (
                   <div key={i} className="w-full h-full bg-gray-500 rounded-full"></div>
                 ))}
               </div>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#1E212B] transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#2A2E39] flex items-center justify-center text-white">
                  <Archive size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Storage Used</div>
                  <div className="text-xs text-gray-500 font-medium">Artwork volume</div>
                </div>
              </div>
              <div className="font-bold text-white">{formatBytes(fileData.totalSize || 0)}</div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#1E212B] transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">Pending Review</div>
                  <div className="text-xs text-gray-500 font-medium">Awaiting action</div>
                </div>
              </div>
              <div className="font-bold text-white">{fileData.pendingReview || 0}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
