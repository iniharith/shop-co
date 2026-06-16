"use client";
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSyncParcel, useSendWhatsApp } from "@/hooks/useAdminDashboard";
import { RefreshCw, MessageSquare, Download, AlertCircle, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TrackingCardProps {
  parcel: any;
}

const statusMap: Record<string, { label: string; step: number; icon: any; color: string }> = {
  pending: { label: "Pending", step: 0, icon: Package, color: "text-slate-500" },
  picked_up: { label: "Picked Up", step: 1, icon: Package, color: "text-blue-500" },
  in_transit: { label: "In Transit", step: 2, icon: Truck, color: "text-indigo-500" },
  out_for_delivery: { label: "Out for Delivery", step: 3, icon: Truck, color: "text-orange-500" },
  delivered: { label: "Delivered", step: 4, icon: CheckCircle2, color: "text-emerald-500" },
  failed: { label: "Failed", step: 0, icon: XCircle, color: "text-rose-500" },
};

export default function TrackingCard({ parcel }: TrackingCardProps) {
  const { mutate: syncMutate, isPending: isSyncing } = useSyncParcel();
  const { mutate: whatsappMutate, isPending: isSending } = useSendWhatsApp();

  const handleSync = () => {
    syncMutate(parcel._id, {
      onSuccess: (data) => {
        if (data.statusChanged) toast.success(`Status updated to ${data.newStatus}`);
        else toast.info("Tracking status is up to date");
      },
      onError: () => toast.error("Failed to sync tracking"),
    });
  };

  const handleWhatsApp = () => {
    whatsappMutate(parcel._id, {
      onSuccess: (data) => {
        if (data.success) toast.success("WhatsApp message sent successfully");
        else toast.error("Failed to send WhatsApp message");
      },
      onError: () => toast.error("Failed to trigger WhatsApp"),
    });
  };

  const currentStatus = statusMap[parcel.status] || statusMap["pending"];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col gap-4">
      {/* Header: Courier & Status */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{parcel.courier}</span>
          <h3 className="font-display text-lg font-bold text-slate-900 mt-1">{parcel.trackingNumber}</h3>
        </div>
        <Badge variant="secondary" className={`bg-slate-50 border border-slate-100 ${currentStatus.color} rounded-full px-3 py-1 flex items-center`}>
          <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
          {currentStatus.label}
        </Badge>
      </div>

      {/* Customer Info */}
      <div className="flex flex-col gap-1 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-900">{parcel.customerName}</span>
          <span className="text-xs text-slate-500">{format(new Date(parcel.updatedAt), "dd MMM yyyy, HH:mm")}</span>
        </div>
      </div>

      {/* Progress Bar Timeline */}
      <div className="py-2">
        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          {parcel.status !== "failed" ? (
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${currentStatus.step === 4 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${(currentStatus.step / 4) * 100}%` }}
            />
          ) : (
            <div className="absolute top-0 left-0 h-full w-full rounded-full bg-rose-500" />
          )}
        </div>
        <div className="flex justify-between mt-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <span className={currentStatus.step >= 0 ? "text-slate-700" : ""}>Pending</span>
          <span className={currentStatus.step >= 2 ? "text-slate-700" : ""}>Transit</span>
          <span className={currentStatus.step >= 4 ? "text-slate-700" : ""}>Delivered</span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync} 
            disabled={isSyncing}
            className="rounded-full h-8 px-3 bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleWhatsApp} 
            disabled={isSending}
            className={`rounded-full h-8 px-3 border-slate-200 hover:bg-green-50 ${parcel.whatsappNotified ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-600'}`}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            {parcel.whatsappNotified ? 'Notified' : 'Notify'}
          </Button>
        </div>

        {parcel.awbUrl ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(parcel.awbUrl, "_blank")}
            className="rounded-full h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Download AWB"
          >
            <Download className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled className="rounded-full h-8 w-8 p-0" title="No AWB">
            <AlertCircle className="w-4 h-4 text-slate-300" />
          </Button>
        )}
      </div>
    </div>
  );
}
