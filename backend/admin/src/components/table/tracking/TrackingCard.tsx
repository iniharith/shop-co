"use client";
import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSyncParcel, useSendWhatsApp, useUpdateParcel } from "@/hooks/useAdminDashboard";
import { RefreshCw, MessageSquare, Download, AlertCircle, Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Calendar } from "lucide-react";
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
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateParcel();

  const [autoNotify, setAutoNotify] = useState(parcel.whatsappNotified ?? true);

  const handleAutoNotifyChange = (checked: boolean) => {
    setAutoNotify(checked);
    updateMutate({ id: parcel._id, data: { whatsappNotified: checked } });
  };

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    syncMutate(parcel._id, {
      onSuccess: (data) => {
        if (data.statusChanged) toast.success(`Status updated to ${data.newStatus}`);
        else toast.info("Tracking status is up to date");
      },
      onError: () => toast.error("Failed to sync tracking"),
    });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <Sheet>
      <SheetTrigger asChild>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col gap-4 cursor-pointer">
          {/* Header: Courier & Status */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{parcel.courier}</span>
              <h3 className="font-display text-lg font-bold text-slate-900 mt-1">{parcel.trackingNumber}</h3>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Select 
                value={parcel.status} 
                onValueChange={(v) => updateMutate({ id: parcel._id, data: { status: v } })}
                disabled={isUpdating}
              >
                <SelectTrigger className={`h-8 text-xs font-medium border-0 rounded-full bg-slate-50 border-slate-100 ${currentStatus.color}`}>
                  <div className="flex items-center">
                    <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Switch id={`auto-notify-${parcel._id}`} checked={autoNotify} onCheckedChange={handleAutoNotifyChange} disabled={isUpdating} />
              <Label htmlFor={`auto-notify-${parcel._id}`} className="text-xs text-slate-600 cursor-pointer">Auto-notify</Label>
            </div>

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

              {parcel.awbUrl ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); window.open(parcel.awbUrl, "_blank"); }}
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
        </div>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tracking Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Tracking No.</span>
              <span className="font-semibold text-slate-900">{parcel.trackingNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Customer</span>
              <span className="font-medium text-slate-900">{parcel.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Courier</span>
              <span className="font-medium text-slate-900">{parcel.courier}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Status</span>
              <Select 
                value={parcel.status} 
                onValueChange={(v) => updateMutate({ id: parcel._id, data: { status: v } })}
                disabled={isUpdating}
              >
                <SelectTrigger className={`w-[180px] h-8 text-xs font-medium border-0 ${currentStatus.color}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Auto-notify</span>
              <Switch checked={autoNotify} onCheckedChange={handleAutoNotifyChange} disabled={isUpdating} />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" /> Event History
            </h4>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200"></div>
              {parcel.events && parcel.events.length > 0 ? (
                parcel.events.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shrink-0">
                      {index === 0 ? <CheckCircle2 className="w-3 h-3 text-blue-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <div className="flex flex-col pb-4 border-b border-slate-100 last:border-0 last:pb-0 w-full">
                      <span className="text-sm font-medium text-slate-900">{event.description || event.status}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.datetime ? format(new Date(event.datetime), "dd MMM yyyy, HH:mm") : 'N/A'}</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic ml-8">No event history available.</div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
