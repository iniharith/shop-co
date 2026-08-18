"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Printer, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const PRODUCTION_STATUSES = ['IN_PRODUCTION', 'DONE_PRINTING', 'PRINT_AWB'];

export default function ProductionMetrics() {
  const { data: session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ['queue-analytics-production'],
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
  const dailyThroughput = data?.data?.dailyThroughput || [];

  const productionCount = statusBreakdown
    .filter((s: any) => PRODUCTION_STATUSES.includes(s._id))
    .reduce((sum: number, s: any) => sum + s.count, 0);

  const overdue = summary.overdueTasks || 0;
  const completedToday = dailyThroughput[dailyThroughput.length - 1]?.completed || 0;
  const createdToday = dailyThroughput[dailyThroughput.length - 1]?.created || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Production Queue</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[28px] bg-cyan-500/10 border border-cyan-500/20 p-5">
          <Printer className="h-5 w-5 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold">{productionCount}</div>
          <div className="text-xs text-gray-500 mt-1">In Production</div>
        </div>
        <div className="rounded-[28px] bg-green-500/10 border border-green-500/20 p-5">
          <CheckCircle2 className="h-5 w-5 text-green-400 mb-3" />
          <div className="text-3xl font-bold">{completedToday}</div>
          <div className="text-xs text-gray-500 mt-1">Completed Today</div>
        </div>
        <div className="rounded-[28px] bg-blue-500/10 border border-blue-500/20 p-5">
          <Clock className="h-5 w-5 text-blue-400 mb-3" />
          <div className="text-3xl font-bold">{createdToday}</div>
          <div className="text-xs text-gray-500 mt-1">Created Today</div>
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
