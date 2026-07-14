import { BouncySkeleton } from "@/components/global/skeleton/BouncySkeleton";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <BouncySkeleton text="SYSTEM LOADING" />
    </div>
  );
}
