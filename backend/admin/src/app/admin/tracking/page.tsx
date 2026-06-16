"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import TrackingList from "@/components/table/tracking/trackingList";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function TrackingPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Customer Tracking 🚚"
            description="Manage EasyParcel shipments and WhatsApp notifications"
          />
        </div>
        <Separator />
        <ScrollArea className="md:w-[80vw] w-[92vw]">
          <TrackingList />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </PageContainer>
  );
}
