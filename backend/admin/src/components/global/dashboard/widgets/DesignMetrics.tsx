"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ClipboardList, Palette, Clock, AlertTriangle } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const STATUS_GROUPS = {
  design: ['IN_DESIGN', 'PEMBETULAN', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED'],
  review: ['ARTWORK_REVIEWED'],
  correction: ['PEMBETULAN'],
};

export default function DesignMetrics() {
  const { data: session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ['queue-analytics-design'],
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

  const designCount = statusBreakdown
    .filter((s: any) => STATUS_GROUPS.design.includes(s._id))
    .reduce((sum: number, s: any) => sum + s.count, 0);

  const correctionCount = statusBreakdown
    .find((s: any) => s._id === 'PEMBETULAN')?.count || 0;

  const reviewCount = statusBreakdown
    .find((s: any) => s._id === 'ARTWORK_REVIEWED')?.count || 0;

  const overdue = summary.overdueTasks || 0;

  return (
    <div className="rounded-[28px] border border-white/10 bg-card/40 backdrop-blur-md p-5">
      <h3 className="text-lg font-bold mb-4">Design Queue</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[28px] bg-violet-500/10 border border-violet-500/20 p-5">
          <Palette className="h-5 w-5 text-violet-400 mb-3" />
          <div className="text-3xl font-bold">{designCount}</div>
          <div className="text-xs text-gray-500 mt-1">In Design Pipeline</div>
        </div>
        <div className="rounded-[28px] bg-orange-500/10 border border-orange-500/20 p-5">
          <AlertTriangle className="h-5 w-5 text-orange-400 mb-3" />
          <div className="text-3xl font-bold">{correctionCount}</div>
          <div className="text-xs text-gray-500 mt-1">Corrections</div>
        </div>
        <div className="rounded-[28px] bg-blue-500/10 border border-blue-500/20 p-5">
          <ClipboardList className="h-5 w-5 text-blue-400 mb-3" />
          <div className="text-3xl font-bold">{reviewCount}</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting Review</div>
        </div>
        <div className="rounded-[28px] bg-red-500/10 border border-red-500/20 p-5">
          <Clock className="h-5 w-5 text-red-400 mb-3" />
          <div className="text-3xl font-bold">{overdue}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
      </div>
    </div>
  );
}
