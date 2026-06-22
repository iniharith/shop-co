import React from "react";
import { IOrder } from "@/types/IOrder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CellAction } from "@/components/global/cell-actions";
import OrderInfo from "@/components/global/orderInfo";
import { cn } from "@/lib/utils";
import { Package, CircleUserRound, MapPin, CreditCard, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteOrder, useUpdateOrderStatus } from "@/hooks/useOrder";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
      return "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30 text-black dark:text-white";
    case "PENDING_ARTWORK":
      return "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30 text-black dark:text-white";
    case "ARTWORK_REVIEW":
      return "bg-blue-400/20 border-blue-400/40 hover:bg-blue-400/30 text-black dark:text-white";
    case "ARTWORK_REJECTED":
      return "bg-red-400/20 border-red-400/40 hover:bg-red-400/30 text-black dark:text-white";
    case "IN_DESIGN":
      return "bg-indigo-500/20 border-indigo-500/40 hover:bg-indigo-500/30 text-black dark:text-white";
    case "DONE DESIGN":
      return "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-black dark:text-white";
    case "PEMBETULAN":
      return "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-black dark:text-white";
    case "IN_PRODUCTION":
      return "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/40 text-black dark:text-white";
    case "SHIPPED":
      return "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/40 text-black dark:text-white";
    case "IN_TRANSIT":
      return "bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/40 text-black dark:text-white";
    case "DELIVERED":
      return "bg-green-500/20 border-green-500/40 hover:bg-green-500/40 text-black dark:text-white";
    case "CANCELLED":
      return "bg-red-500/20 border-red-500/40 hover:bg-red-500/40 text-black dark:text-white";
    default:
      return "bg-gray-500/20 border-gray-500/40 hover:bg-gray-500/40 text-black dark:text-white";
  }
};

const getPaymentColor = (status: string) => {
  if (status === "PAID") return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  if (status === "FAILED") return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
  return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700";
};

interface OrderCardProps {
  order: IOrder;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const user = order.userId as any;
  const userName = user && typeof user === "object" ? user.name : user || "Unknown";
  
  const platform = (order as any).platform || "Website";
  
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  
  const [localStatus, setLocalStatus] = React.useState(order.orderStatus);

  React.useEffect(() => {
    setLocalStatus(order.orderStatus);
  }, [order.orderStatus]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      deleteOrder(order._id as string, {
        onSuccess: () => {
          toast.success("Order deleted successfully");
          window.location.reload();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to delete order");
        }
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border border-border/50 rounded-2xl flex flex-col justify-between">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80" />
      
      <CardHeader className="pb-3 pt-6 px-5 flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
             <CircleUserRound className="w-8 h-8 text-muted-foreground mt-0.5" />
             <div className="flex flex-col">
               <span className="font-semibold text-lg leading-tight">{order.customerName || userName}</span>
               <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                 <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary tracking-tight font-mono font-bold">
                   ORD-{order._id.split("").reverse().splice(0, 4).reverse().join("")}
                 </span>
                 • {platform}
               </span>
             </div>
          </div>
        
        <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Select 
            value={localStatus} 
            onValueChange={(v) => {
              setLocalStatus(v);
              updateStatus({ id: order._id as string, status: v }, {
                onSuccess: () => toast.success("Order status updated!"),
                onError: () => {
                  toast.error("Failed to update status");
                  setLocalStatus(order.orderStatus);
                }
              });
            }}
            disabled={isUpdating}
          >
            <SelectTrigger className={cn("h-8 text-xs font-semibold uppercase tracking-wider border-0 rounded-full", getStatusColor(localStatus))}>
              <div className="flex items-center">
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLACED">Placed</SelectItem>
              <SelectItem value="PENDING_ARTWORK">Pending Artwork</SelectItem>
              <SelectItem value="ARTWORK_REVIEW">Artwork Review</SelectItem>
              <SelectItem value="ARTWORK_REJECTED">Artwork Rejected</SelectItem>
              <SelectItem value="IN_DESIGN">In Design</SelectItem>
              <SelectItem value="DONE DESIGN">Done Design</SelectItem>
              <SelectItem value="PEMBETULAN">Pembetulan</SelectItem>
              <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 py-4 flex-1">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <div className="flex items-start gap-2">
             <ShoppingBag className="w-4 h-4 mt-0.5 text-muted-foreground" />
             <div className="flex flex-col">
               <span className="text-muted-foreground text-xs font-medium uppercase">Products</span>
               <span className="font-medium">{order.products?.length || 0} Items</span>
             </div>
          </div>
          
          <div className="flex items-start gap-2">
             <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
             <div className="flex flex-col">
               <span className="text-muted-foreground text-xs font-medium uppercase">Payment</span>
               <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="font-medium text-xs truncate max-w-[60px]">{order.paymentMethod}</span>
                 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border leading-none h-4", getPaymentColor(order.paymentStatus))}>
                   {order.paymentStatus}
                 </Badge>
               </div>
             </div>
          </div>

          <div className="flex items-start gap-2">
             <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
             <div className="flex flex-col">
               <span className="text-muted-foreground text-xs font-medium uppercase">Address</span>
               <span className="font-medium line-clamp-2 text-sm leading-snug">
                 {order.address?.address || order.address?.city || "-"}
               </span>
             </div>
          </div>

          <div className="flex items-start gap-2">
             <Truck className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
             <div className="flex flex-col">
               <span className="text-muted-foreground text-xs font-medium uppercase">Tracking No.</span>
               <span className="font-medium text-sm leading-snug break-all">
                 {(order as any).trackingNumber || "-"}
               </span>
             </div>
          </div>

          {order.orderNotes && (
            <div className="flex items-start gap-2 col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
               <Package className="w-4 h-4 mt-0.5 text-yellow-600 shrink-0" />
               <div className="flex flex-col">
                 <span className="text-yellow-700 text-xs font-bold uppercase tracking-wider">Order Notes</span>
                 <span className="font-medium text-sm text-yellow-800 italic mt-0.5">
                   "{order.orderNotes}"
                 </span>
               </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-5 py-4 border-t bg-muted/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order Total</span>
          <span className="text-xl font-bold tracking-tight text-foreground">
             RM{Number(order.totalAmount).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Order"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <CellAction
            info={<OrderInfo order={order as any} />}
            id={(order as any)._id}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderCard;
