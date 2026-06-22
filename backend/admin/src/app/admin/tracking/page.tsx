"use client";
import PageContainer from "@/components/layout/page-container";
import TrackingList from "@/components/table/tracking/trackingList";

export default function TrackingPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Real-time Order Tracker
          </h1>
          <p className="text-muted-foreground">
            Monitor EasyParcel shipments and trigger WhatsApp notifications.
          </p>
        </div>
        
        <div className="w-full">
          <TrackingList />
        </div>
      </div>
    </PageContainer>
  );
}
