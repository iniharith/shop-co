/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSyncParcel, useSendWhatsApp } from "@/hooks/useAdminDashboard";
import { RefreshCw, MessageSquare, Download, CircleAlert } from "lucide-react";
import { toast } from "sonner";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "trackingNumber",
    header: "Tracking Number",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "courier",
    header: "Courier",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "outline",
        picked_up: "secondary",
        in_transit: "secondary",
        out_for_delivery: "default",
        delivered: "default",
        failed: "destructive",
      };
      return <Badge variant={variants[status] || "default"}>{status.replace(/_/g, ' ')}</Badge>;
    },
  },
  {
    accessorKey: "whatsappNotified",
    header: "Notified",
    cell: ({ row }) => {
      const notified = row.getValue("whatsappNotified") as boolean;
      return notified ? <Badge variant="default" className="bg-green-500">Yes</Badge> : <Badge variant="outline">No</Badge>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Update",
    cell: ({ row }) => {
      return format(new Date(row.getValue("updatedAt")), "dd MMM, HH:mm");
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const parcel = row.original;
      const { mutate: syncMutate, isPending: isSyncing } = useSyncParcel();
      const { mutate: whatsappMutate, isPending: isSending } = useSendWhatsApp();

      const handleSync = () => {
        syncMutate(parcel._id, {
          onSuccess: (data) => {
            if (data.statusChanged) toast.success(`Status updated to ${data.newStatus}`);
            else toast.info("Tracking status is up to date");
            window.location.reload();
          },
          onError: () => toast.error("Failed to sync tracking"),
        });
      };

      const handleWhatsApp = () => {
        whatsappMutate(parcel._id, {
          onSuccess: (data) => {
            if (data.success) toast.success("WhatsApp message sent successfully");
            else toast.error("Failed to send WhatsApp message");
            window.location.reload();
          },
          onError: () => toast.error("Failed to trigger WhatsApp"),
        });
      };

      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} title="Sync Tracking">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp} disabled={isSending} title="Send WhatsApp Update">
            <MessageSquare className="w-4 h-4 text-green-500" />
          </Button>
          {parcel.awbUrl ? (
            <Button variant="outline" size="sm" onClick={() => window.open(parcel.awbUrl, "_blank")} title="Download AWB">
              <Download className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="No AWB Available">
              <CircleAlert className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      );
    },
  },
];
