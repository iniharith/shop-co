/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useEffect, useState } from "react";
import { useAllFiles } from "@/hooks/useAdminDashboard";
import { useOrders } from "@/hooks/useOrder";
import { useUsers } from "@/hooks/useUsers";
import { useTasks } from "@/hooks/useTasks";
import { Loader2, Printer, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function PrintDraftsPage() {
  const { data: filesData, isLoading: filesLoading } = useAllFiles();
  const { data: tasksResponse, isLoading: tasksLoading } = useTasks();
  const { data: ordersResponse, isLoading: ordersLoading } = useOrders();
  const { data: usersResponse, isLoading: usersLoading } = useUsers();
  
  const [drafts, setDrafts] = useState<any[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(4);

  const tasks = tasksResponse?.tasks || [];
  const orders = ordersResponse?.data || [];
  const users = usersResponse?.data || [];

  const isLoading = filesLoading || tasksLoading || ordersLoading || usersLoading;

  useEffect(() => {
    if (filesData?.data) {
      const allDrafts = filesData.data.filter((f: any) => f.tag === 'draft');
      setDrafts(allDrafts);
    }
  }, [filesData]);

  const getFolderName = (draft: any) => {
    if (draft.taskId && draft.taskId !== 'undefined') {
      const task = tasks.find((t: any) => t._id === draft.taskId);
      if (task) return task.title;
      return `Task: ${draft.taskId}`;
    }
    if (draft.orderId && draft.orderId !== 'undefined') {
      const order = orders.find((o: any) => o._id === draft.orderId);
      if (order) return `Order: ${order.orderId}`;
      return `Order: ${draft.orderId}`;
    }
    const user = users.find((u: any) => u._id === draft.userId);
    if (user) return `User: ${user.name}`;
    return draft.originalName;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">No drafts found in the system to print.</p>
      </div>
    );
  }

  // Chunk drafts based on selected items per page
  const pages = [];
  for (let i = 0; i < drafts.length; i += itemsPerPage) {
    pages.push(drafts.slice(i, i + itemsPerPage));
  }

  // Determine grid classes for print layout
  let gridColsRows = "grid-cols-2 grid-rows-2";
  if (itemsPerPage === 6) gridColsRows = "grid-cols-2 grid-rows-3";
  if (itemsPerPage === 10) gridColsRows = "grid-cols-2 grid-rows-5";

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50 flex flex-col p-6 print:p-0 print:bg-white print:overflow-visible">
      {/* SCREEN PREVIEW HEADER */}
      <div className="mb-6 no-print w-full flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Print Drafts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {drafts.length} total drafts. Will generate {pages.length} pages.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            <LayoutGrid className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Layout:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
            >
              <option value={4}>4 per page (2x2)</option>
              <option value={6}>6 per page (2x3)</option>
              <option value={10}>10 per page (2x5)</option>
            </select>
          </div>

          <Button onClick={() => window.print()} className="gap-2 shadow-sm">
            <Printer className="w-4 h-4" /> Print All ({pages.length} Pages)
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}} />

      {/* SCREEN PREVIEW LAYOUT (Normal Grid, 120x120 images) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
        {drafts.map((draft: any) => (
          <div key={draft._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="relative w-full h-[120px] bg-gray-50 flex items-center justify-center border-b border-gray-100 p-2">
              <Image 
                src={draft.path} 
                alt={draft.originalName} 
                fill 
                className="object-contain p-2"
                sizes="120px"
              />
            </div>
            <div className="p-2 bg-white flex flex-col items-center justify-center">
              <p className="text-xs text-gray-700 font-medium truncate w-full text-center" title={getFolderName(draft)}>
                {getFolderName(draft)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* PRINT EXACT LAYOUT (Hidden on screen, shown in print) */}
      <div id="print-section" className="hidden print:block">
        {pages.map((pageDrafts, pageIndex) => (
          <div 
            key={pageIndex}
            className="relative overflow-hidden flex flex-col bg-white"
            style={{
              width: "210mm",
              height: "297mm",
              pageBreakAfter: "always",
              padding: "10mm",
              boxSizing: "border-box"
            }}
          >
            <div className={`grid ${gridColsRows} gap-[10mm] w-full h-full`}>
              {pageDrafts.map((draft: any) => (
                <div key={draft._id} className="relative w-full h-full flex items-center justify-center p-2">
                  <div className="border border-dashed border-gray-600 p-2 flex flex-col items-center justify-center max-w-full max-h-full rounded-md bg-white">
                    <img 
                      src={draft.path} 
                      alt={draft.originalName} 
                      className="max-w-full object-contain"
                      style={{ maxHeight: 'calc(100% - 2.5rem)' }} 
                    />
                    <div className="mt-2 text-center w-full">
                      <p className="text-sm font-bold text-gray-900 font-mono truncate w-full px-2" title={getFolderName(draft)}>
                        {getFolderName(draft)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
