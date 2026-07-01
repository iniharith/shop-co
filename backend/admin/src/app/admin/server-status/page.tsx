/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Server, Database, Activity, Cpu, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface HealthData {
  server: {
    uptime: number;
    cpuLoad: number[];
    totalMem: number;
    freeMem: number;
    usedMem: number;
  };
  database: {
    status: string;
  };
  timestamp: string;
}

export default function ServerHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      // Use standard fetch but we must include credentials since it's a protected sysadmin route
      // Wait, we need to pass the JWT. In this app, we might use next-auth.
      // But standard fetch doesn't send the token unless handled or cookies are used.
      // Next-auth uses cookies by default on the same domain, so credentials: 'include' is needed.
      const res = await fetch(`${BACKEND}/api/sysadmin/health`, {
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
  };

  useEffect(() => {
    fetchHealth();
    // Auto refresh every 30s
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const handleGenerateReport = () => {
    // A simple, elegant way to generate a report without heavy dependencies is triggering print.
    // The browser's native print-to-PDF handles CSS media queries.
    window.print();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Server Health</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchHealth} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={handleGenerateReport} className="print:hidden">
            <Download className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 report-container">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(data.server.uptime)}</div>
              <p className="text-xs text-muted-foreground mt-1">Continuous operation</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Load (Avg)</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.server.cpuLoad[0].toFixed(2)}, {data.server.cpuLoad[1].toFixed(2)}, {data.server.cpuLoad[2].toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1m, 5m, 15m averages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((data.server.usedMem / data.server.totalMem) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(data.server.usedMem)} / {formatBytes(data.server.totalMem)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.database.status === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>
                {data.database.status}
              </div>
              <p className="text-xs text-muted-foreground mt-1">MongoDB Connection</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No data available.</div>
      )}
      
      {data && (
        <div className="mt-8 text-xs text-muted-foreground text-right print:block hidden">
          Report generated on {format(new Date(), 'PPpp')}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .report-container, .report-container * { visibility: visible; }
          .report-container { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}} />
    </div>
  );
}
