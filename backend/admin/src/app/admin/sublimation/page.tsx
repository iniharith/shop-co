/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import SublimationManager from "@/components/global/sublimation/sublimationManager";

export default function SublimationPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4 bg-background/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between">
          <Heading
            title="Sublimation Manager 👕"
            description="View and manage apparel artworks for sublimation printing, hold and sent"
          />
        </div>
        <Separator />
        <SublimationManager />
      </div>
    </PageContainer>
  );
}
