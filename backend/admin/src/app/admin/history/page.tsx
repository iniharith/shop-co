/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import HistoryManager from "@/components/global/history/historyManager";

export default function HistoryPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Order History 📜"
            description="View completed and cancelled orders"
          />
        </div>
        <Separator />
        <HistoryManager />
      </div>
    </PageContainer>
  );
}
