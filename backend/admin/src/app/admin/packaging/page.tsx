/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import PackagingManager from "@/components/global/packaging/packagingManager";

export default function PackagingPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Packaging Manager 📦"
            description="View and manage artworks for orders currently being packaged"
          />
        </div>
        <Separator />
        <PackagingManager />
      </div>
    </PageContainer>
  );
}
