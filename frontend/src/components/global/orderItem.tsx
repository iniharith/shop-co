"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IOrder } from "@/types/IOrder";
import OrderTracker from "@/components/page-sections/profile/orderTracker";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useCustomerTasks, useAddCustomerTaskComment } from "@/hooks/useTasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderItemProps {
  order: IOrder;
}

const OrderItem = ({ order }: OrderItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const { data: response } = useCustomerTasks();
  const tasks = response?.tasks?.filter((t: any) => t.orderId === order._id) || [];
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const { mutate: addComment, isPending: isCommenting } = useAddCustomerTaskComment();

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedTask) return;
    addComment({ id: selectedTask._id, text: commentText }, {
      onSuccess: (data) => {
        setCommentText("");
        setSelectedTask(data.task); 
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLACED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "DELIVERED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const badgeClassName = getStatusColor(order.orderStatus);
  return (
    <div className="border rounded-lg overflow-hidden transition-shadow hover:shadow-md bg-white">
      <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 sm:mb-0">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-gray-500" />
            <span className="font-medium">
              ORD-{order._id.split("").reverse().slice(0, 6).reverse().join("")}
            </span>
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-6" />
          <span className="text-gray-500 text-sm">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Badge
            variant="outline"
            className={`${badgeClassName} border-0 whitespace-nowrap`}
          >
            {order.orderStatus}
          </Badge>
          <span className="font-medium">RM {order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {order.products.length}{" "}
            {order.products.length === 1 ? "item" : "items"}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowTracker(!showTracker);
                if (!showTracker) setExpanded(false);
              }}
              className="text-primary border-primary/20 hover:bg-primary/5"
            >
              {showTracker ? "Tutup Tracker" : "📦 Jejak Parcel"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpanded(!expanded);
                if (!expanded) setShowTracker(false);
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              {expanded ? (
                <>
                  <span className="text-sm mr-1">Hide Details</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span className="text-sm mr-1">View Details</span>
                  <ChevronDown size={16} />
                </>
              )}
            </Button>

            <Button size="sm" asChild>
              <Link href={`/home/profile/orders/${order._id}`}>View Order</Link>
            </Button>
          </div>
        </div>

        {/* Tracker View */}
        {showTracker && (
          <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <OrderTracker orderId={order._id} />
          </div>
        )}

        {/* Product Details & Tasks View */}
        {expanded && (
          <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-300">
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="mb-4 bg-muted/50">
                <TabsTrigger value="items">Order Items</TabsTrigger>
                <TabsTrigger value="tasks" className="relative">
                  Tasks & Updates 
                  {tasks.length > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-[10px] rounded-full px-2 py-0.5">
                      {tasks.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="space-y-4">
                {order.products.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={
                          item.product.images[0]?.startsWith("/")
                            ? process.env.NEXT_PUBLIC_BACKEND_URL + item.product.images[0]
                            : item.product.images[0]
                        }
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="font-medium">RM {item.price.toFixed(2)}</div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="tasks">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No active tasks or updates for this order.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {tasks.map((task: any) => (
                      <div 
                        key={task._id} 
                        onClick={() => setSelectedTask(task)}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md cursor-pointer transition-all flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-semibold text-sm">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="mt-auto pt-3 flex gap-4 text-[10px] text-gray-400 font-medium border-t border-gray-50">
                          {task.dueDate && (
                            <span className="flex items-center gap-1.5"><CalendarIcon size={12} /> {format(new Date(task.dueDate), "MMM d")}</span>
                          )}
                          <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {task.comments?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Task Comment Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              {selectedTask?.description || "No description provided."}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Updates & Comments</h4>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {selectedTask?.comments?.map((comment: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`text-xs ${comment.role === 'client' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-600'}`}>
                        {comment.userName?.substring(0, 2).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none p-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-gray-900">{comment.userName}</span>
                        <span className="text-[10px] text-gray-400">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {(!selectedTask?.comments || selectedTask.comments.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Input 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ask a question or reply..."
                  className="bg-gray-50 border-gray-200"
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={isCommenting} size="icon" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderItem;
