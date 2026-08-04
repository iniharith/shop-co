/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useState } from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import HistoryManager from "@/components/global/history/historyManager";

export default function HistoryPage() {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  return (
    <PageContainer scrollable={true} smooth={false} scrollContainerRef={setScrollParent}>
      <div className="flex flex-1 flex-col space-y-4 bg-background/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between">
          <Heading
            title="Order History 📜"
            description="View completed and cancelled orders"
          />
        </div>
        <Separator />
        <HistoryManager scrollParent={scrollParent} />
      </div>
    </PageContainer>
  );
}
