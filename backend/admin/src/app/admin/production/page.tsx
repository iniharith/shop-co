"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import ProductionManager from "@/components/global/production/productionManager";

export default function ProductionPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Production Manager 🖨️"
            description="View and manage artworks for orders currently in production"
          />
        </div>
        <Separator />
        <ProductionManager />
      </div>
    </PageContainer>
  );
}
