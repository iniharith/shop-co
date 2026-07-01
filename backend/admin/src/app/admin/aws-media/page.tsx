/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Cloud, FileText, Search, RefreshCw, File } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface S3Object {
  key: string;
  size: number;
  lastModified: string;
  storageClass: string;
}

export default function AwsMediaPage() {
  const [items, setItems] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/sysadmin/aws-media`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch AWS media");
      if (json.success) {
        setItems(json.data.items);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch AWS media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredItems = items.filter(item => item.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AWS Media Server</h2>
        <Button onClick={fetchMedia} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>S3 Bucket Contents</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Viewing objects in kampungcetak-storage
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 transition-colors">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">File Name (Key)</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Size</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Last Modified</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">No files found</td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            <File className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="truncate max-w-[300px] sm:max-w-[500px]" title={item.key}>{item.key}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">{formatBytes(item.size)}</td>
                        <td className="p-4 align-middle">{format(new Date(item.lastModified), 'PPpp')}</td>
                        <td className="p-4 align-middle"><span className="text-xs bg-muted px-2 py-1 rounded-md">{item.storageClass}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
