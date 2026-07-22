/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useMemo } from "react";
import { DataTableSkeleton } from "../table/data-table-skeleton";
import { useOrders } from "@/hooks/useOrder";
import { useBulkDeleteOrders } from "@/hooks/useOrder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderCard from "../../table/orders/OrderCard";
import { Search, PackageX, RefreshCw, Archive, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTasks, usePermanentDeleteTask } from "@/hooks/useTasks";
import { useFileIndex } from "@/hooks/useAdminDashboard";
import TaskModal from "../tasks/TaskModal";
import { Folder } from "lucide-react";

const HistoryManager = () => {
  const { data, isPending, refetch, isFetching } = useOrders();
  const { data: deletedTasksData, isPending: isTasksPending, refetch: refetchTasks, isFetching: isFetchingTasks } = useTasks({ deleted: 'true' });
  const { data: doneTasksData } = useTasks({ statuses: 'SHIPPED,DELIVERED,DONE_DESIGN,DONE,IN_TRANSIT' });
  const deletedTasks = (deletedTasksData as any);
  const doneTasks: any[] = (doneTasksData as any)?.tasks || [];
  const { data: fileIndexResponse } = useFileIndex();
  const allFiles = (fileIndexResponse as any)?.data || [];
  const { mutate: permanentDeleteTaskMutate, isPending: isPermanentDeleting } = usePermanentDeleteTask();
  const { mutate: bulkDeleteMutate, isPending: isDeleting } = useBulkDeleteOrders();
  const [activeTab, setActiveTab] = useState("DONE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);

  React.useEffect(() => {
    if (selectedTask && deletedTasks?.tasks?.length > 0) {
      const updatedTask = deletedTasks.tasks.find((t: any) => t._id === selectedTask._id);
      if (updatedTask && updatedTask !== selectedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [deletedTasksData, selectedTask]);

  const filteredOrders = useMemo(() => {
    let orders = data?.orders || [];
    
    if (activeTab === "DONE") {
      orders = orders.filter((o: any) => !o.isArchived && (o.orderStatus === "DELIVERED" || o.orderStatus === "DONE_DESIGN" || o.orderStatus === "SHIPPED" || o.orderStatus === "IN_TRANSIT"));
    } else if (activeTab === "CANCELLED") {
      orders = orders.filter((o: any) => !o.isArchived && (o.orderStatus === "CANCELLED" || o.orderStatus === "FAILED"));
    } else if (activeTab === "ARCHIVED") {
      orders = orders.filter((o: any) => o.isArchived);
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      orders = orders.filter((o: any) => 
        o.trackingNumber?.toLowerCase().includes(lowerQuery) ||
        o.customerName?.toLowerCase().includes(lowerQuery) ||
        o.userId?.name?.toLowerCase().includes(lowerQuery) ||
        o.userId?.email?.toLowerCase().includes(lowerQuery) ||
        o._id?.toLowerCase().includes(lowerQuery)
      );
    }
    
    return orders;
  }, [data, activeTab, searchQuery]);

  const filteredDoneTasks = useMemo(() => {
    if (activeTab !== "DONE") return [];
    const displayedOrderIds = new Set((filteredOrders || []).map((o: any) => o._id));
    let tasks = doneTasks.filter((t: any) => !t.orderId || !displayedOrderIds.has(t.orderId));
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      tasks = tasks.filter((t: any) => 
        t.title?.toLowerCase().includes(lowerQuery) ||
        t.customerUsername?.toLowerCase().includes(lowerQuery) ||
        t.orderId?.toLowerCase().includes(lowerQuery) ||
        t._id?.toLowerCase().includes(lowerQuery)
      );
    }
    return tasks;
  }, [doneTasks, activeTab, searchQuery, filteredOrders]);

  const filteredTasks = useMemo(() => {
    let tasks = deletedTasks?.tasks || [];
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      tasks = tasks.filter((t: any) => 
        t.title?.toLowerCase().includes(lowerQuery) ||
        t.customerUsername?.toLowerCase().includes(lowerQuery) ||
        t.orderId?.toLowerCase().includes(lowerQuery) ||
        t._id?.toLowerCase().includes(lowerQuery)
      );
    }
    return tasks;
  }, [deletedTasksData, searchQuery]);

  if (isPending || isTasksPending) return <DataTableSkeleton />;

  const handleDeleteAll = () => {
    if (filteredOrders.length === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ALL ${filteredOrders.length} orders in this view? This action cannot be undone.`);
    if (!confirmDelete) return;

    const orderIds = filteredOrders.map((o: any) => o._id);
    bulkDeleteMutate(orderIds);
  };

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="flex h-auto gap-2 justify-start bg-muted/20 p-1 rounded-xl">
              <TabsTrigger value="DONE" className="rounded-lg">Done / Completed</TabsTrigger>
              <TabsTrigger value="CANCELLED" className="rounded-lg text-red-500 data-[state=active]:bg-red-500 data-[state=active]:text-white">Cancelled / Failed</TabsTrigger>
              <TabsTrigger value="ARCHIVED" className="rounded-lg text-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Archived</TabsTrigger>
              <TabsTrigger value="DELETED_TASKS" className="rounded-lg text-slate-500 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Deleted Tasks</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search history by Tracking No, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl bg-background border-border"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => activeTab === 'DELETED_TASKS' ? refetchTasks() : refetch()} disabled={isFetching || isFetchingTasks} className="rounded-xl h-10 w-10 shadow-sm border-border shrink-0" title="Refresh History">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${(isFetching || isFetchingTasks) ? 'animate-spin' : ''}`} />
            </Button>
            {activeTab !== 'DELETED_TASKS' && (
              <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting || filteredOrders.length === 0} className="rounded-xl h-10 shadow-sm shrink-0" title="Delete All Displayed Orders">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>
        
        {activeTab === 'DELETED_TASKS' ? (
          filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-dashed border-border/60">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1 text-foreground">No deleted tasks</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                There are no deleted tasks in the history.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-10">
              {filteredTasks.map((task: any) => {
                const taskFiles = allFiles.filter((f: any) => f.taskId === task._id);
                return (
                <div key={task._id} className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedTask(task)}>
                    <div className="bg-slate-200 p-3 rounded-xl">
                      <Folder className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg hover:underline">{task.title}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        {task.orderId && <span>Order: {task.orderId}</span>}
                        {task.customerUsername && <span>Customer: {task.customerUsername}</span>}
                        {task.category && <span>Category: {task.category}</span>}
                        <span>{taskFiles.length} file(s)</span>
                        <span>Deleted on: {new Date(task.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to permanently delete this task? All files will be removed. This cannot be undone.")) {
                        permanentDeleteTaskMutate(task._id);
                      }
                    }}
                    disabled={isPermanentDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete
                  </Button>
                </div>
              );
              })}
            </div>
          )
        ) : (
          (filteredOrders.length === 0 && filteredDoneTasks.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-dashed border-border/60">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <PackageX className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1 text-foreground">No orders or tasks found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                We couldn't find any completed items in this history view.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-10">
              {filteredDoneTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Completed Tasks ({filteredDoneTasks.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoneTasks.map((task: any) => {
                      const taskFiles = allFiles.filter((f: any) => f.taskId === task._id);
                      return (
                        <div key={task._id} className="flex items-center justify-between p-4 bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl cursor-pointer hover:border-emerald-400 transition-all" onClick={() => setSelectedTask(task)}>
                          <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-xl">
                              <Folder className="w-6 h-6 text-emerald-700" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base hover:underline text-emerald-950">{task.title}</h4>
                              <div className="flex flex-wrap gap-2 text-xs text-emerald-800 mt-1">
                                <span className="bg-emerald-200/60 px-2 py-0.5 rounded font-semibold uppercase">{task.status}</span>
                                {task.orderId && <span>Order: #{task.orderId}</span>}
                                <span>{taskFiles.length} file(s)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredOrders.length > 0 && (
                <div className="space-y-3">
                  {filteredDoneTasks.length > 0 && <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Orders ({filteredOrders.length})</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredOrders.map((order: any) => (
                      <div key={order._id} className={activeTab === "CANCELLED" ? "border-2 border-red-500 bg-red-50 rounded-2xl p-2 relative overflow-hidden" : activeTab === "ARCHIVED" ? "border-2 border-indigo-500 bg-indigo-50/50 rounded-2xl p-2 relative overflow-hidden" : ""}>
                        {activeTab === "CANCELLED" && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                            CANCELLED
                          </div>
                        )}
                        {activeTab === "ARCHIVED" && (
                          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                            <Archive className="w-3 h-3" /> ARCHIVED
                          </div>
                        )}
                        <div className={activeTab === "CANCELLED" ? "[&_*]:text-red-900" : activeTab === "ARCHIVED" ? "[&_*]:text-indigo-900" : ""}>
                          <OrderCard order={order} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
        
        {selectedTask && (
          <TaskModal 
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            task={selectedTask}
          />
        )}
      </div>
    );
  }
  return null;
};

export default HistoryManager;
