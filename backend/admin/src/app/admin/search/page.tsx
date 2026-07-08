"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useTasks } from "@/hooks/useTasks";
import { useAllFiles, useGroupedFiles } from "@/hooks/useAdminDashboard";
import { useUsers } from "@/hooks/useUsers";
import { useOrders } from "@/hooks/useOrder";
import { Folder, File as FileIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const queryLower = q.toLowerCase();

  const { data: tasksData, isLoading: isLoadingTasks } = useTasks();
  const { data: filesData, isLoading: isLoadingFiles } = useAllFiles();
  const { data: usersData } = useUsers();
  const { data: ordersData } = useOrders();

  const tasks = tasksData?.tasks || [];
  const files = (filesData as any)?.data || [];
  const users = usersData?.users || [];
  const orders = ordersData?.orders || [];

  // Filter Tasks
  const matchingTasks = useMemo(() => {
    if (!queryLower) return [];
    return tasks.filter((t: any) => 
      String(t.title || "").toLowerCase().includes(queryLower) ||
      String(t.orderId || "").toLowerCase().includes(queryLower) ||
      String(t.customerUsername || "").toLowerCase().includes(queryLower)
    );
  }, [tasks, queryLower]);

  // Group and Filter Folders (similar to ArtworksManager)
  const matchingFolders = useMemo(() => {
    if (!queryLower) return [];
    
    // First, group all non-background files
    const validFiles = files.filter((f: any) => f.category !== "UI_BACKGROUND");
    
    const groups: Record<string, any[]> = {};
    validFiles.forEach((file: any) => {
      let groupName = "Unassigned";
      let orderIdStr = "";
      
      if (file.category === 'TASK' && file.taskId) {
        const task = tasks.find((t: any) => t._id === file.taskId);
        groupName = task ? task.title : "Deleted Task";
        orderIdStr = task?.orderId || "";
      } else {
        if (file._shareFolderName) {
          groupName = file._shareFolderName;
        } else {
          const user = users.find((u: any) => u._id?.toString() === file.userId?.toString());
          groupName = user?.name || file.userId;
        }
        orderIdStr = file.orderId || "";
      }

      const key = `${groupName}-${orderIdStr}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });

    const groupedArray = Object.entries(groups).map(([key, groupFiles]) => {
      const firstFile = groupFiles[0];
      let folderName = "Unassigned";
      let orderIdStr = "";
      let customerStr = "";
      
      if (firstFile.category === 'TASK' && firstFile.taskId) {
        const task = tasks.find((t: any) => t._id === firstFile.taskId);
        folderName = task ? task.title : "Deleted Task";
        orderIdStr = task?.orderId || "";
        customerStr = task?.customerUsername || "";
      } else {
        if (firstFile._shareFolderName) {
          folderName = firstFile._shareFolderName;
        } else {
          const user = users.find((u: any) => u._id?.toString() === firstFile.userId?.toString());
          folderName = user?.name || firstFile.userId;
          customerStr = user?.email || user?.username || "";
        }
        orderIdStr = firstFile.orderId || "";
      }

      let folderCategory = 'ARTWORK';
      if (firstFile.category === 'PACKAGING') folderCategory = 'PACKAGING';
      else if (firstFile.category === 'PRODUCTION') folderCategory = 'PRODUCTION';

      return {
        key,
        folderName,
        orderId: orderIdStr,
        customerUsername: customerStr,
        category: folderCategory,
        files: groupFiles,
      };
    });

    // Filter the grouped array based on query
    return groupedArray.filter((g) => 
      String(g.folderName || "").toLowerCase().includes(queryLower) ||
      String(g.orderId || "").toLowerCase().includes(queryLower) ||
      String(g.customerUsername || "").toLowerCase().includes(queryLower)
    );
  }, [files, tasks, users, queryLower]);

  const artworkFolders = matchingFolders.filter(f => f.category === 'ARTWORK');
  const productionFolders = matchingFolders.filter(f => f.category === 'PRODUCTION');
  const packagingFolders = matchingFolders.filter(f => f.category === 'PACKAGING');

  const renderFolderSection = (title: string, folderList: typeof matchingFolders) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight uppercase">{title}</h2>
      {isLoadingFiles ? (
        <p className="text-muted-foreground text-sm">Searching folders...</p>
      ) : folderList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {folderList.map((group) => (
            <Card 
              key={group.key} 
              className="cursor-pointer overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all group relative"
              onClick={() => {
                const firstFile = group.files[0];
                if (firstFile?.taskId) {
                  router.push(`/admin/tasks?taskId=${firstFile.taskId}`);
                } else if (firstFile?.category === 'PACKAGING') {
                  router.push(`/admin/packaging`);
                } else if (firstFile?.category === 'PRODUCTION') {
                  router.push(`/admin/production`);
                } else {
                  router.push(`/admin/artworks`);
                }
              }}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm relative group-hover:scale-105 transition-transform">
                  <Folder className="w-8 h-8 text-primary" />
                </div>
                <div className="w-full">
                  <h3 className="font-semibold text-base truncate" title={group.folderName}>{group.folderName}</h3>
                  {group.orderId && (
                    <p className="text-[12.8px] font-bold text-foreground/80 mt-1 truncate">
                      Order: {group.orderId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{group.files.length} item(s)</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm italic">No matching folders found.</p>
      )}
    </div>
  );

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Search Results"
            description={`Showing results for "${q}"`}
          />
        </div>
        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight uppercase">TASK</h2>
          {isLoadingTasks ? (
            <p className="text-muted-foreground text-sm">Searching tasks...</p>
          ) : matchingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingTasks.map((task: any) => (
                <Card 
                  key={task._id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => router.push(`/admin/tasks?taskId=${task._id}`)}
                >
                  <CardContent className="p-4 flex flex-col gap-2">
                    <h3 className="font-semibold text-base truncate">{task.title}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {task.orderId && <span>Order: <span className="font-medium text-foreground">{task.orderId}</span></span>}
                      {task.customerUsername && <span>Customer: <span className="font-medium text-foreground">{task.customerUsername}</span></span>}
                      <span>Status: <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs">{task.status.replace(/_/g, ' ')}</span></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">No matching tasks found.</p>
          )}
        </div>

        <Separator />
        {renderFolderSection("ARTWORK FOLDER", artworkFolders)}
        
        <Separator />
        {renderFolderSection("PRODUCTION FOLDER", productionFolders)}
        
        <Separator />
        {renderFolderSection("PACKAGING FOLDER", packagingFolders)}
      </div>
    </PageContainer>
  );
}
