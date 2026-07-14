"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, User, CheckCircle, Clock, File, TrendingUp, Printer } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useUsers } from "@/hooks/useUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import LoadingAnimation from "@/components/global/LoadingAnimation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ReportsPage() {
  const { data: session } = useSession();
  const { data: usersResponse, isPending: usersLoading } = useUsers();
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const users = Array.isArray(usersResponse?.users) ? usersResponse.users : [];

  const fetchReport = React.useCallback(async (userId: string) => {
    if (!userId) return;
    const token = (session?.user as any)?.token || (typeof window !== 'undefined' && localStorage.getItem('token')) || "";
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/sysadmin/reports?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch report data");
      if (json.success) {
        setReportData(json.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (selectedUserId) {
      fetchReport(selectedUserId);
    } else {
      setReportData(null);
    }
  }, [selectedUserId, fetchReport]);

  if (usersLoading) {
    return <LoadingAnimation fullScreen={false} label="Loading" />;
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto print:hidden">
      {/* Header matching server-status */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap items-center space-x-2 md:space-x-6">
          <div className="flex items-center text-white font-bold text-xl mr-4">
            <Activity className="w-6 h-6 mr-2" />
            <span>Staff Reports</span>
          </div>
          <div className="flex flex-wrap gap-2 md:space-x-4 text-xs md:text-sm font-medium text-gray-500">
            <span className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>Overview
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-4">
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
          
          {selectedUserId && reportData && (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print (A4)
            </button>
          )}
        </div>
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
            <MetricCard 
              icon={<User className="w-5 h-5 text-blue-400" />} 
              title="Assigned Tasks" 
              value={reportData.tasksAssigned} 
            />
            <MetricCard 
              icon={<CheckCircle className="w-5 h-5 text-green-400" />} 
              title="Tasks Completed" 
              value={reportData.tasksCompleted} 
            />
            <MetricCard 
              icon={<Clock className="w-5 h-5 text-orange-400" />} 
              title="Avg Time Taken" 
              value={reportData.avgTimeFormatted || "-"} 
            />
            <MetricCard 
              icon={<File className="w-5 h-5 text-purple-400" />} 
              title="File Quantity" 
              value={reportData.fileQuantity} 
            />
            <MetricCard 
              icon={<TrendingUp className="w-5 h-5 text-yellow-400" />} 
              title="Efficiency" 
              value={`${reportData.efficiency}%`} 
            />
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 lg:p-6 backdrop-blur-sm mt-6">
            <h3 className="text-lg font-medium mb-6 text-gray-200">Tasks Completed (Last 30 Days)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.chartData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completed Tasks"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCompleted)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* --- A4 Print Layout --- */}
      {selectedUserId && reportData && (
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
