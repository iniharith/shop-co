"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Package, Truck, CheckCircle2, AlertTriangle } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function PackagingMetrics() {
  const { data: session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ['queue-analytics-packaging'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/sysadmin/queue-analytics?days=30`, {
        headers: { Authorization: `Bearer ${session?.user?.token}` },
      });
      return res.json();
    },
    enabled: !!session?.user?.token,
    refetchInterval: 30000,
  });

  if (isPending) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-card/40 animate-pulse rounded-[28px] border border-white/10" />)}
    </div>;
  }

  const summary = data?.data?.summary || {};
  const statusBreakdown = data?.data?.statusBreakdown || [];

  const packagingCount = statusBreakdown.find((s: any) => s._id === 'PACKAGING')?.count || 0;
  const shippedCount = statusBreakdown.find((s: any) => s._id === 'SHIPPED')?.count || 0;
  const deliveredCount = statusBreakdown.find((s: any) => s._id === 'DELIVERED')?.count || 0;
  const overdue = summary.overdueTasks || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Packaging & Shipping</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[28px] bg-purple-500/10 border border-purple-500/20 p-5">
          <Package className="h-5 w-5 text-purple-400 mb-3" />
          <div className="text-3xl font-bold">{packagingCount}</div>
          <div className="text-xs text-gray-500 mt-1">Ready to Pack</div>
        </div>
        <div className="rounded-[28px] bg-blue-500/10 border border-blue-500/20 p-5">
          <Truck className="h-5 w-5 text-blue-400 mb-3" />
          <div className="text-3xl font-bold">{shippedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Shipped</div>
        </div>
        <div className="rounded-[28px] bg-green-500/10 border border-green-500/20 p-5">
          <CheckCircle2 className="h-5 w-5 text-green-400 mb-3" />
          <div className="text-3xl font-bold">{deliveredCount}</div>
          <div className="text-xs text-gray-500 mt-1">Delivered</div>
        </div>
        <div className="rounded-[28px] bg-red-500/10 border border-red-500/20 p-5">
          <AlertTriangle className="h-5 w-5 text-red-400 mb-3" />
          <div className="text-3xl font-bold">{overdue}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
      </div>
    </div>
  );
}
