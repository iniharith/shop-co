/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import TrackingList from "@/components/table/tracking/trackingList";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCustomerUpdateSettings, useUpdateCustomerUpdateSettings } from "@/hooks/useAdminDashboard";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TrackingPage() {
  const { data: session } = useSession();
  const { data: settings, isPending: isLoadingSettings } = useCustomerUpdateSettings();
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateCustomerUpdateSettings();
  const customerUpdatesEnabled = (settings as any)?.data?.enabled === true;
  const canManageCustomerUpdates = ['admin', 'sysadmin', 'boss'].includes(session?.user?.role || '');

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-time Order Tracker
            </h1>
            <p className="text-muted-foreground">Monitor and update EasyParcel shipment progress.</p>
          </div>
          {canManageCustomerUpdates && (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="customer-auto-updates" className="font-semibold">WhatsApp auto-update</Label>
              <p className="text-xs text-muted-foreground">Notify customers when delivery status changes</p>
            </div>
            {isLoadingSettings ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="customer-auto-updates"
                checked={customerUpdatesEnabled}
                onCheckedChange={(enabled) => updateSettings(enabled)}
                disabled={isUpdatingSettings}
              />
            )}
          </div>
          )}
        </div>
        
        <div className="w-full bg-background/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
          <TrackingList />
        </div>
      </div>
    </PageContainer>
  );
}
