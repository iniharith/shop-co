import React from "react";
import { IOrder } from "@/types/IOrder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CellAction } from "@/components/global/cell-actions";
import OrderInfo from "@/components/global/orderInfo";
import { cn } from "@/lib/utils";
import { Package, UserCircle2, MapPin, CreditCard, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useDeleteOrder } from "@/hooks/useOrder";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    case "SHIPPED":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700";
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
  
  // Platform logic based on user request (Tiktok/Shopee/Website)
  const platform = (order as any).platform || "Website";
  
  // Tracking number prominently displayed, fallback to ID
  const displayId = (order as any).trackingNumber ? (order as any).trackingNumber : `ORD-${order._id.split("").reverse().splice(0, 4).reverse().join("")}`;

  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();

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
             <UserCircle2 className="w-8 h-8 text-muted-foreground mt-0.5" />
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
        
        <div className="flex flex-col items-end gap-2">
          <Badge className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider border", getStatusColor(order.orderStatus))} variant="outline">
            {order.orderStatus}
          </Badge>
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
          {(!order.userId || platform !== "WEB") && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Delete External Order"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
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
