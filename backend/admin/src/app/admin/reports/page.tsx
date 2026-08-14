"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, User, CheckCircle, Clock, File, TrendingUp, Printer, Database, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useUsers } from "@/hooks/useUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import LoadingAnimation from "@/components/global/LoadingAnimation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type ReportTab = "staff" | "monthly";

export default function ReportsPage() {
  const { data: session } = useSession();
  const { data: usersResponse, isPending: usersLoading } = useUsers();
  const token = (session?.user as any)?.token || (typeof window !== 'undefined' && localStorage.getItem('token')) || "";

  const [tab, setTab] = useState<ReportTab>("staff");

  // Staff performance
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState("");

  // Monthly orders
  const [month, setMonth] = useState<string>(() => format(new Date(), "yyyy-MM"));
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyLoaded, setMonthlyLoaded] = useState("");

  const users = Array.isArray(usersResponse?.users) ? usersResponse.users : [];

  const fetchReport = React.useCallback(async (userId: string, signal?: AbortSignal) => {
    if (!userId) return;
    setLoading(true);
    setReportData(null);
    setLoadedUserId("");
    try {
      const res = await fetch(`${BACKEND}/api/sysadmin/reports?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: "include",
        signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch report data");
      if (json.success) {
        setReportData(json.data);
        setLoadedUserId(userId);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') toast.error(error.message || "Failed to fetch report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab !== "staff") return;
    if (selectedUserId) {
      const controller = new AbortController();
      fetchReport(selectedUserId, controller.signal);
      return () => controller.abort();
    } else {
      setReportData(null);
    }
  }, [selectedUserId, fetchReport, tab]);

  const fetchMonthly = React.useCallback(async (value: string) => {
    if (!value) return;
    setMonthlyLoading(true);
    setMonthlyData(null);
    setMonthlyLoaded("");
    try {
      const res = await fetch(`${BACKEND}/api/admin/reports/monthly-orders?month=${value}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch monthly report");
      if (json.success) {
        setMonthlyData(json);
        setMonthlyLoaded(value);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch monthly report");
      setMonthlyData(null);
    } finally {
      setMonthlyLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "monthly" && month) {
      fetchMonthly(month);
    }
  }, [tab, month, fetchMonthly]);

  const downloadCsv = async () => {
    if (!month) return;
    try {
      const res = await fetch(`${BACKEND}/api/admin/reports/monthly-orders/export?month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monthly-orders-${month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Failed to export CSV");
    }
  };

  if (usersLoading) {
    return <LoadingAnimation fullScreen={false} label="Loading" />;
  }

  const summary = monthlyData?.summary;
  const monthlyRows = Array.isArray(monthlyData?.rows) ? monthlyData.rows : [];
  const toNum = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto print:hidden">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center space-x-2 md:space-x-6">
            <div className="flex items-center text-white font-bold text-xl mr-4">
              <Activity className="w-6 h-6 mr-2" />
              <span>Reports</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={tab === "staff" ? "default" : "outline"}
              onClick={() => setTab("staff")}
              className={tab === "staff" ? "bg-blue-600 hover:bg-blue-700" : "text-white border-gray-700 hover:bg-gray-800"}
            >
              Staff Performance
            </Button>
            <Button
              variant={tab === "monthly" ? "default" : "outline"}
              onClick={() => setTab("monthly")}
              className={tab === "monthly" ? "bg-blue-600 hover:bg-blue-700" : "text-white border-gray-700 hover:bg-gray-800"}
            >
              <Database className="w-4 h-4 mr-2" /> Monthly Orders
            </Button>
          </div>
        </div>

        {tab === "staff" && (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-64 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {users.map((user: any) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUserId && reportData && loadedUserId === selectedUserId && !loading && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print (A4)
                </button>
              )}
            </div>

            {!selectedUserId && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-900/20">
                <User className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a staff member to view their performance report</p>
              </div>
            )}

            {loading && selectedUserId && (
              <LoadingAnimation fullScreen={false} label="Loading report" />
            )}

            {!loading && reportData && (
              <div className="space-y-6">
                <div className="flex justify-between items-end mb-2">
                  <h1 className="text-3xl font-semibold tracking-tight">Performance Snapshot</h1>
                  <div className="text-right text-gray-500 text-xs hidden sm:block">
                    <div className="mb-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</div>
                    <div>{format(new Date(), 'hh:mm a')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCard icon={<User className="w-5 h-5 text-blue-400" />} title="Assigned Tasks" value={reportData.tasksAssigned} />
                  <MetricCard icon={<CheckCircle className="w-5 h-5 text-green-400" />} title="Completed / Downstream" value={reportData.tasksCompleted} />
                  <MetricCard icon={<Clock className="w-5 h-5 text-orange-400" />} title="Est. Design Cycle" value={reportData.avgTimeFormatted || "-"} />
                  <MetricCard icon={<File className="w-5 h-5 text-purple-400" />} title="Retained Files" value={reportData.fileQuantity} />
                  <MetricCard icon={<TrendingUp className="w-5 h-5 text-yellow-400" />} title="Completion Ratio" value={`${reportData.efficiency}%`} />
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 lg:p-6 backdrop-blur-sm mt-6">
                  <h3 className="text-lg font-medium mb-2 text-gray-200">Status Completions (Last 30 Days)</h3>
                  <p className="mb-6 text-xs text-gray-500">Based on the latest recorded status-change timestamp. Reassignment history is not yet available.</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.chartData}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#60a5fa' }} />
                        <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "monthly" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Report Month</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="pl-9 w-52 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={downloadCsv}
                disabled={!monthlyData || monthlyLoading}
                className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            {monthlyLoading && <LoadingAnimation fullScreen={false} label="Loading monthly report" />}

            {!monthlyLoading && monthlyData && monthlyLoaded === month && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard icon={<Activity className="w-5 h-5 text-blue-400" />} title="Orders" value={summary?.orderCount ?? 0} />
                  <MetricCard icon={<File className="w-5 h-5 text-purple-400" />} title="Files" value={summary?.fileCount ?? 0} />
                  <MetricCard icon={<Database className="w-5 h-5 text-green-400" />} title="Total Size (MB)" value={`${toNum(summary?.fileSizeMB).toFixed(2)} MB`} />
                  <MetricCard icon={<Database className="w-5 h-5 text-yellow-400" />} title="Total Size (GB)" value={`${toNum(summary?.fileSizeGB).toFixed(2)} GB`} />
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-left text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Item Ordered</th>
                          <th className="px-4 py-3">Files</th>
                          <th className="px-4 py-3">File Size</th>
                          <th className="px-4 py-3">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">
                              No orders found for {month}.
                            </td>
                          </tr>
                        )}
                        {monthlyRows.map((row: any, index: number) => (
                          <tr key={`${row.orderId}-${index}`} className={`border-b border-gray-800/50 ${index % 2 === 0 ? 'bg-transparent' : 'bg-gray-800/20'}`}>
                            <td className="px-4 py-3 font-medium text-gray-200">{row.customerName}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.orderId}</td>
                            <td className="px-4 py-3 text-gray-300">{row.category}</td>
                            <td className="px-4 py-3 max-w-xs">
                              <div className="text-gray-200 font-medium">{row.itemName}</div>
                              {row.itemDescription && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{row.itemDescription}</div>
                              )}
                              {row.size && <div className="text-xs text-gray-500 mt-0.5">Size: {row.size} · Qty: {row.quantity}</div>}
                            </td>
                            <td className="px-4 py-3 text-gray-300">{row.fileCount}</td>
                            <td className="px-4 py-3 text-gray-300">
                              {toNum(row.fileTotalBytes) > 0 ? `${toNum(row.fileSizeMB).toFixed(2)} MB (${toNum(row.fileSizeGB).toFixed(2)} GB)` : "0 B"}
                            </td>
                            <td className="px-4 py-3 text-gray-300">{row.assignedTo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- A4 Print Layout (staff) --- */}
      {tab === "staff" && selectedUserId && reportData && loadedUserId === selectedUserId && (
        <div className="hidden print:block bg-white text-black p-4 text-sm w-full font-sans">
          <div className="border-b-2 border-gray-900 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">Staff Performance Report</h1>
            <p className="text-gray-600 mt-2 font-medium">
              Staff Name: <span className="text-black">{users.find((u: any) => u._id === selectedUserId)?.name || "Unknown"}</span>
            </p>
            <p className="text-gray-600 font-medium">
              Date: <span className="text-black">{format(new Date(), 'dd MMMM yyyy, hh:mm a')}</span>
            </p>
          </div>

          <div className="flex gap-8 mb-8 border border-gray-300 p-4 rounded-lg bg-gray-50">
            <div><span className="text-gray-500 font-semibold text-xs uppercase block">Total Assigned</span><span className="text-xl font-bold">{reportData.tasksAssigned}</span></div>
            <div><span className="text-gray-500 font-semibold text-xs uppercase block">Total Completed</span><span className="text-xl font-bold">{reportData.tasksCompleted}</span></div>
            <div><span className="text-gray-500 font-semibold text-xs uppercase block">Avg Time</span><span className="text-xl font-bold">{reportData.avgTimeFormatted || "-"}</span></div>
            <div><span className="text-gray-500 font-semibold text-xs uppercase block">Files Handled</span><span className="text-xl font-bold">{reportData.fileQuantity}</span></div>
            <div><span className="text-gray-500 font-semibold text-xs uppercase block">Efficiency</span><span className="text-xl font-bold">{reportData.efficiency}%</span></div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Detailed Task List</h3>

          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 text-[10px] uppercase tracking-wider">
                <th className="border border-gray-300 py-1 px-2">Task Name</th>
                <th className="border border-gray-300 py-1 px-2 w-24">Status</th>
                <th className="border border-gray-300 py-1 px-2 w-16 text-center">Files</th>
                <th className="border border-gray-300 py-1 px-2 w-24 text-center">Time Took</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {reportData.detailedTasks?.map((task: any, index: number) => (
                <tr key={task._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 py-1 px-2 font-medium">{task.title}</td>
                  <td className="border border-gray-300 py-1 px-2 text-[10px]">
                    <span className={`px-1 py-0.5 rounded-sm font-bold uppercase tracking-wider ${task.isDone ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="border border-gray-300 py-1 px-2 text-center font-semibold text-gray-700">{task.fileCount}</td>
                  <td className="border border-gray-300 py-1 px-2 text-center font-semibold text-gray-700">
                    {task.timeTookFormatted || '-'}
                  </td>
                </tr>
              ))}
              {(!reportData.detailedTasks || reportData.detailedTasks.length === 0) && (
                <tr>
                  <td colSpan={4} className="border border-gray-300 py-2 text-center text-gray-500 italic">No tasks found for this staff member.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-8 text-center text-xs text-gray-400">
            Report generated by System Administrator
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <Card className="bg-gray-900/60 border-gray-800 text-white backdrop-blur-sm">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
