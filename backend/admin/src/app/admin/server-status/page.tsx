"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, Database, Server, Archive, Globe, Train, Cloud } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ServerHealthPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = React.useCallback(async () => {
    const token = (session?.user as any)?.token || (typeof window !== 'undefined' && localStorage.getItem('token')) || "";
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/sysadmin/health`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch health data");
      if (json.success) {
        setData(json.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch server health");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const token = (session?.user as any)?.token || (typeof window !== 'undefined' && localStorage.getItem('token')) || "";
    if (!token) return;

    fetchHealth();
    // Auto refresh every 5 seconds to show bandwidth changes
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth, session]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0m";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading && !data) {
    return <div className="min-h-screen bg-transparent flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
      {/* Header matching the image */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap items-center space-x-2 md:space-x-6">
          <div className="flex items-center text-white font-bold text-xl mr-4">
            <Activity className="w-6 h-6 mr-2" />
          </div>
          <div className="flex flex-wrap gap-2 md:space-x-4 text-xs md:text-sm font-medium text-gray-500">
            <span className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>Overview
            </span>
            <span className="hover:text-white transition-colors cursor-pointer px-3 py-1.5">Notes</span>
            <span className="hover:text-white transition-colors cursor-pointer px-3 py-1.5">Document</span>
            <span className="hover:text-white transition-colors cursor-pointer px-3 py-1.5">Labs</span>
            <span className="hover:text-white transition-colors cursor-pointer px-3 py-1.5">Settings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-3xl font-semibold tracking-tight">Your Server Health Snapshot</h1>
            <div className="text-right text-gray-500 text-xs hidden sm:block">
              <div className="mb-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</div>
              <div>{format(new Date(), 'hh:mm a')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Progression Chart */}
            <div className="md:col-span-2 bg-card/40 backdrop-blur-md p-6 rounded-[28px] border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center font-medium">
                  <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-3 text-white">
                    <Activity size={14} />
                  </div>
                  Task Progression
                </div>
                <div className="text-xs bg-[#242731] text-gray-400 px-3 py-1.5 rounded-lg border border-gray-800">
                  Last 7 Days
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="min-w-[120px]">
                  <div className="text-gray-500 text-xs font-medium mb-1">Avg tasks/day</div>
                  <div className="text-4xl font-semibold mb-6 tracking-tight">
                    {((data.charts?.progression || []).reduce((acc: number, curr: any) => acc + curr.count, 0) / Math.max(1, (data.charts?.progression || []).length)).toFixed(1)}
                  </div>
                  <div className="text-blue-400 text-xs font-medium mb-1 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></div>
                    Completed
                  </div>
                  <div className="text-2xl font-semibold">{data.application?.taskTotal || 0}</div>
                </div>
                <div className="flex-1 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts?.progression || []}>
                      <Tooltip 
                        cursor={{fill: '#242731'}} 
                        contentStyle={{backgroundColor: '#171923', border: '1px solid #374151', borderRadius: '12px', color: '#fff'}} 
                        itemStyle={{color: '#fff'}}
                      />
                      <Bar dataKey="count" fill="#4B5563" radius={[6,6,6,6]} activeBar={{ fill: '#3B82F6' }} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RAM Usage */}
            <div className="bg-green-500/10 backdrop-blur-md text-green-400 p-6 rounded-[28px] flex flex-col justify-between relative overflow-hidden border border-green-500/20">
              <div className="font-semibold text-sm z-10 opacity-90">RAM usage level</div>
              <div className="text-6xl font-bold z-10 text-right tracking-tighter mt-4">
                {((data.server.usedMem / data.server.totalMem) * 100).toFixed(0)}<span className="text-2xl font-semibold ml-1 opacity-80">%</span>
              </div>
              <div className="text-xs mt-6 z-10 font-medium opacity-80">
                {formatBytes(data.server.usedMem)} used
              </div>
              
              {/* Decorative Arc Graphic */}
              <svg className="absolute bottom-[-20%] left-[-15%] w-[130%] opacity-20 pointer-events-none" viewBox="0 0 100 50">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="4,6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Disk Usage */}
            <div className="bg-card/40 backdrop-blur-md text-white p-6 rounded-[28px] border border-white/10">
              <div className="text-sm font-semibold text-gray-500 mb-4">Disk capacity</div>
              <div className="flex justify-between items-end mb-6">
                <div className="text-4xl font-bold tracking-tight">
                  {(data.server.diskTotal || 0) > 0 ? ((1 - ((data.server.diskFree || 0) / (data.server.diskTotal || 1))) * 100).toFixed(0) : 0}
                  <span className="text-xl font-semibold text-gray-400 ml-1">%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-black h-full rounded-full" 
                  style={{ width: `${(data.server.diskTotal || 0) > 0 ? ((1 - ((data.server.diskFree || 0) / (data.server.diskTotal || 1))) * 100) : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
                <span>{formatBytes((data.server.diskTotal || 0) - (data.server.diskFree || 0))} used</span>
                <span>{formatBytes(data.server.diskTotal || 0)} total</span>
              </div>
            </div>

            {/* CPU Usage */}
            <div className="bg-card/40 backdrop-blur-md p-6 rounded-[28px] border border-white/10 flex flex-col justify-between">
              <div className="text-sm text-gray-400 font-medium">CPU Load</div>
              <div className="flex items-end justify-between mt-2">
                <div className="h-[60px] w-full mr-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      {v: data.server.cpuLoad?.[2] || 0}, 
                      {v: data.server.cpuLoad?.[1] || 0}, 
                      {v: data.server.cpuLoad?.[0] || 0}
                    ]}>
                      <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-4xl font-bold text-white tracking-tight leading-none mb-1">
                  {(data.server.cpuLoad?.[0] || 0).toFixed(1)}
                  <span className="text-[10px] text-gray-500 ml-1 uppercase font-semibold">Avg</span>
                </div>
              </div>
            </div>

            {/* Bandwidth */}
            <div className="bg-card/40 backdrop-blur-md p-6 rounded-[28px] border border-white/10 flex flex-col justify-between">
              <div className="text-sm text-gray-400 font-medium">Data transfer</div>
              <div className="flex justify-between items-end mt-2">
                <div className="text-3xl font-bold text-white tracking-tight leading-none mb-1">
                  {formatBytes(data.charts?.bandwidth?.[(data.charts?.bandwidth?.length || 1) - 1]?.bytesOut || 0)}
                  <span className="text-[10px] text-gray-500 ml-1 uppercase font-semibold">/s</span>
                </div>
              </div>
              <div className="h-[40px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(data.charts?.bandwidth || []).slice(-15)}>
                    <Line type="stepAfter" dataKey="bytesOut" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* External Services & Infrastructure Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vercel Status */}
            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between items-start h-[130px] group hover:border-white/20 transition-all">
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold truncate">Vercel (Frontend)</div>
                  <div className="text-xs text-gray-500 truncate">kampungcetak.com</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between w-full">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center ${data.external?.vercel?.readyState === 'READY' ? 'bg-green-500/10 text-green-400' : data.external?.vercel?.readyState ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${data.external?.vercel?.readyState === 'READY' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  {data.external?.vercel?.readyState || 'UNKNOWN'}
                </div>
              </div>
            </div>
            
            {/* Railway Status */}
            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between items-start h-[130px] group hover:border-white/20 transition-all">
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-full bg-[#13111C] border border-white/10 text-white flex items-center justify-center shrink-0">
                  <Train size={18} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold truncate">Railway (Backend)</div>
                  <div className="text-xs text-gray-500 truncate">{data.external?.railway?.environment || 'Production'}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between w-full">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center ${data.external?.railway?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${data.external?.railway?.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {data.external?.railway?.status || 'UNKNOWN'}
                </div>
              </div>
            </div>

            {/* AWS Server Status */}
            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between items-start h-[130px] group hover:border-white/20 transition-all">
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-full bg-[#FF9900]/10 text-[#FF9900] flex items-center justify-center shrink-0">
                  <Cloud size={18} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold truncate">AWS S3 Server</div>
                  <div className="text-xs text-gray-500 truncate">kampungcetak-storage</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between w-full">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center ${data.external?.aws === 'ONLINE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${data.external?.aws === 'ONLINE' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {data.external?.aws || 'UNKNOWN'}
                </div>
              </div>
            </div>

            {/* MongoDB Status */}
            <div className="bg-card/40 backdrop-blur-md p-5 rounded-[28px] border border-white/10 flex flex-col justify-between items-start h-[130px] group hover:border-white/20 transition-all">
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <Database size={18} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold truncate">MongoDB Atlas</div>
                  <div className="text-xs text-gray-500 truncate">{data.database?.detailed?.connections?.current || 0} active conn</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between w-full">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center ${data.database?.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${data.database?.status === 'Connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {data.database?.status || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Analytics */}
        <div className="bg-card/40 backdrop-blur-md rounded-[32px] p-8 border border-white/10 flex flex-col">
          <h2 className="text-xl font-bold mb-8">System Analytics & Files</h2>
          
          <div className="bg-background/40 backdrop-blur-sm rounded-3xl p-6 mb-8 relative overflow-hidden border border-white/5">
            <div className="text-gray-400 text-sm mb-2 text-center font-medium relative z-10">Total Artwork Files</div>
            <div className="text-6xl font-bold text-center text-white my-6 tracking-tighter relative z-10">
              {data.application?.artworkTotal || 0}
            </div>
            <div className="flex justify-center mt-2 relative z-10">
              <span className="bg-[#064e3b] text-[#4ade80] px-4 py-1.5 rounded-full text-xs font-bold flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mr-2"></div> Available
              </span>
            </div>
            
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="grid grid-cols-6 grid-rows-6 h-full w-full gap-2 p-2">
                 {Array.from({length: 36}).map((_, i) => (
                   <div key={i} className="w-full h-full bg-gray-500 rounded-full"></div>
                 ))}
               </div>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#1E212B] transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black">
                  <Archive size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Storage Used</div>
                  <div className="text-xs text-gray-500 font-medium">Uploaded volume</div>
                </div>
              </div>
              <div className="font-bold text-white">{formatBytes(data.application?.storageUsed || 0)}</div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#1E212B] transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#2A2E39] flex items-center justify-center text-white">
                  <Server size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Server Space</div>
                  <div className="text-xs text-gray-500 font-medium">Physical capacity</div>
                </div>
              </div>
              <div className="font-bold text-white">{formatBytes(data.server.diskTotal || 0)}</div>
            </div>
          </div>

          <button 
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-2xl mt-8 transition-colors shadow-lg shadow-blue-500/20"
            onClick={fetchHealth}
          >
            Force Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
