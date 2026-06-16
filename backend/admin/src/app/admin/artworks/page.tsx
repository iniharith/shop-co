"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import ArtworksManager from "@/components/global/artworks/artworksManager";

export default function ArtworksPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Artwork Manager 🎨"
            description="View and manage customer uploaded files"
          />
        </div>
        <Separator />
        <ArtworksManager />
      </div>
    </PageContainer>
  );
}
