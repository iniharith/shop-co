"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, User, CheckCircle, Clock, File, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useUsers } from "@/hooks/useUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

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
    return <div className="min-h-screen bg-transparent flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
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
        
        <div className="w-full md:w-64">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
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
        </div>
      </div>

      {!selectedUserId && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-900/20">
          <User className="w-12 h-12 mb-4 opacity-50" />
          <p>Select a staff member to view their performance report</p>
        </div>
      )}

      {loading && selectedUserId && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
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
              value={`${reportData.avgTimeHours}h`} 
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
