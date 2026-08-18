"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Activity, Clock } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function StaffActivity() {
  const { data: session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ['queue-analytics-activity'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/sysadmin/queue-analytics?days=7`, {
        headers: { Authorization: `Bearer ${session?.user?.token}` },
      });
      return res.json();
    },
    enabled: !!session?.user?.token,
    refetchInterval: 30000,
  });

  if (isPending) {
    return <div className="h-64 bg-card/40 animate-pulse rounded-[28px] border border-white/10" />;
  }

  const staffWorkload = data?.data?.staffWorkload || [];
  const sortedStaff = [...staffWorkload].sort((a: any, b: any) => b.count - a.count).slice(0, 10);

  return (
    <div className="rounded-[28px] border border-white/10 bg-card/40 backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-blue-400" />
        <h3 className="font-bold">Staff Workload</h3>
      </div>
      {sortedStaff.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No active staff assignments</p>
      ) : (
        <div className="space-y-3">
          {sortedStaff.map((staff: any) => (
            <div key={staff._id || 'unassigned'} className="flex items-center gap-3 p-3 rounded-[20px] hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-400">
                {(staff.assigneeName || 'UN').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{staff.assigneeName || 'Unassigned'}</p>
                <p className="text-xs text-gray-500">{staff.count} tasks{staff.overdue > 0 ? ` (${staff.overdue} overdue)` : ''}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{staff.count}</div>
                {staff.oldestAgeHours > 0 && (
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> {Math.round(staff.oldestAgeHours)}h oldest
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
