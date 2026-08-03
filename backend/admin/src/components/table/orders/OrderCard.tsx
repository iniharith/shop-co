/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import { IOrder } from "@/types/IOrder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CellAction } from "@/components/global/cell-actions";
import OrderInfo from "@/components/global/orderInfo";
import { cn } from "@/lib/utils";
import { Package, CircleUserRound, MapPin, CreditCard, ShoppingBag, Trash2, Truck, Archive, ArchiveRestore, ChevronDown, ChevronUp, Printer, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteOrder, useUpdateOrderStatus, useToggleArchiveOrder, useReconcileShipment, useRefreshShipment } from "@/hooks/useOrder";
import { toast } from "sonner";
import EasyParcelShipmentDialog from "./EasyParcelShipmentDialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
      return "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30 text-black dark:text-white";
    case "PENDING_ARTWORK":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "ARTWORK_REVIEWED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "ARTWORK_REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "DONE_DESIGN":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "IN_DESIGN":
      return "bg-indigo-500/20 border-indigo-500/40 hover:bg-indigo-500/30 text-black dark:text-white";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-200";
    case "PEMBETULAN":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "IN_PRODUCTION":
      return "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/40 text-black dark:text-white";
    case "SHIPPED":
      return "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/40 text-black dark:text-white";
    case "IN_TRANSIT":
      return "bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/40 text-black dark:text-white";
    case "DELIVERED":
      return "bg-green-500/20 border-green-500/40 hover:bg-green-500/40 text-black dark:text-white";
    case "RETURNED":
      return "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/40 text-black dark:text-white";
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
  isMinimized?: boolean;
  onMinimizedChange?: (isMinimized: boolean) => void;
  onOpenShipmentDialog?: (order: IOrder) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isMinimized: controlledIsMinimized,
  onMinimizedChange,
  onOpenShipmentDialog,
}) => {
  const user = order.userId as any;
  const userName = user && typeof user === "object" ? user.name : user || "Unknown";
  
  const platform = (order as any).platform || "Website";
  
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutate: toggleArchive, isPending: isArchiving } = useToggleArchiveOrder();
  const { mutate: refreshShipment, isPending: isRefreshingShipment } = useRefreshShipment();
  const { mutate: reconcileShipment, isPending: isReconcilingShipment } = useReconcileShipment();
  
  const [localStatus, setLocalStatus] = React.useState<string>(order.orderStatus as string);
  const [internalIsMinimized, setInternalIsMinimized] = React.useState<boolean>(false);
  const isMinimized = controlledIsMinimized ?? internalIsMinimized;
  const [shipmentDialogOpen, setShipmentDialogOpen] = React.useState(false);
  const awbPrintUrl = order.awbUrlsByFormat?.A6 || order.awbUrlsByFormat?.A4 || order.awbUrl;

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

  const handleMinimizedChange = (nextIsMinimized: boolean) => {
    if (controlledIsMinimized === undefined) setInternalIsMinimized(nextIsMinimized);
    onMinimizedChange?.(nextIsMinimized);
  };

  const handleArchiveToggle = () => {
    const isCurrentlyArchived = order.isArchived || false;
    toggleArchive({ id: order._id as string, isArchived: !isCurrentlyArchived });
  };

  return (
    <Card className={cn("group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border border-border/50 rounded-2xl flex flex-col justify-between", isMinimized ? "h-fit self-start" : "h-full")}>
      {/* Top Gradient Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80" />
      
      <CardHeader className={cn("px-5 flex flex-row justify-between gap-4 relative", isMinimized ? "py-3 items-center" : "pb-3 pt-6 items-start")}>
          <div className={cn("flex gap-3", isMinimized ? "items-center" : "items-start")}>
             <CircleUserRound className={cn("text-muted-foreground", isMinimized ? "w-6 h-6" : "w-8 h-8 mt-0.5")} />
             <div className="flex flex-col justify-center">
               <span className={cn("font-semibold leading-tight truncate max-w-[150px] sm:max-w-[200px]", isMinimized ? "text-base" : "text-lg")}>{order.customerName || userName}</span>
               <span className={cn("text-muted-foreground font-medium flex items-center gap-1.5", isMinimized ? "text-[10px] mt-0" : "text-xs mt-0.5")}>
                 <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary tracking-tight font-mono font-bold">
                   ORD-{order._id.split("").reverse().splice(0, 4).reverse().join("")}
                 </span>
                 • {platform}
               </span>
             </div>
          </div>
        
        <div className="flex flex-col items-end justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Select 
              value={localStatus} 
              onValueChange={(v) => {
                setLocalStatus(v);
                updateStatus({ id: order._id as string, status: v }, {
                  onError: () => {
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
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING_ARTWORK">Pending Artwork</SelectItem>
                <SelectItem value="ARTWORK_REVIEWED">Artwork Reviewed</SelectItem>
                <SelectItem value="ARTWORK_REJECTED">Artwork Rejected</SelectItem>
                <SelectItem value="IN_DESIGN">In Design</SelectItem>
                <SelectItem value="PEMBETULAN">Pembetulan</SelectItem>
                <SelectItem value="DONE_DESIGN">Done Design</SelectItem>
                <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
                <SelectItem value="HOLD_PRINTING">Hold Printing</SelectItem>
                <SelectItem value="DONE_PRINTING">Done Printing</SelectItem>
                <SelectItem value="PACKAGING">Packaging</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            {!order.trackingNumber && !order.easyparcelShipmentId && order.easyparcelBookingStatus !== "submitted" && ["DONE_PRINTING", "PACKAGING"].includes(order.orderStatus) && order.paymentStatus === "PAID" && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenShipmentDialog) onOpenShipmentDialog(order);
                  else setShipmentDialogOpen(true);
                }}
                className="px-2 py-1 bg-primary/10 rounded border border-primary/20 hover:bg-primary/20 text-primary transition-colors text-[10px] font-bold uppercase tracking-wider"
                title="Create EasyParcel Shipment"
              >
                Create AWB
              </button>
            )}
            {!order.trackingNumber && !order.easyparcelShipmentId && order.easyparcelBookingStatus !== "submitted" && !(order.paymentStatus === "PAID" && ["DONE_PRINTING", "PACKAGING"].includes(order.orderStatus)) && (
              <span
                className="rounded border border-muted-foreground/20 bg-muted/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                title={order.paymentStatus !== "PAID" ? "Mark payment as paid before creating an AWB" : "Move order to Done Printing or Packaging before creating an AWB"}
              >
                {order.paymentStatus !== "PAID" ? "AWB after payment" : "AWB after printing"}
              </span>
            )}
            {order.easyparcelBookingStatus === "submitted" && (
              <button
                type="button"
                disabled={isReconcilingShipment}
                onClick={() => {
                  const shipmentNumber = window.prompt("Enter the EasyParcel shipment number shown in Developer Hub (ES-...)", order.easyparcelShipmentId || "");
                  if (!shipmentNumber) return;
                  reconcileShipment({ orderId: order._id, shipmentNumber: shipmentNumber.trim() }, {
                    onSuccess: () => toast.success("EasyParcel shipment reconciled"),
                    onError: (error: any) => toast.error(error.response?.data?.message || "Could not reconcile shipment"),
                  });
                }}
                className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-600"
                title="Submission result was uncertain. Verify it in Developer Hub before retrying."
              >
                {isReconcilingShipment ? "Checking..." : "Reconcile"}
              </button>
            )}
            {order.easyparcelBookingStatus === "awb_pending" && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-600">AWB pending</span>}
            <button 
              onClick={() => {
                if (awbPrintUrl) {
                  window.open(awbPrintUrl, "_blank", "noopener,noreferrer");
                } else if (order.easyparcelBookingStatus === "awb_pending") {
                  refreshShipment(order._id, {
                    onSuccess: () => toast.success("EasyParcel shipment refreshed"),
                    onError: (error: any) => toast.error(error.response?.data?.message || "AWB is still pending"),
                  });
                }
              }}
              disabled={(!awbPrintUrl && order.easyparcelBookingStatus !== "awb_pending") || isRefreshingShipment}
              className="p-1.5 bg-muted rounded-full hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={awbPrintUrl ? "Print AWB" : order.easyparcelBookingStatus === "awb_pending" ? "Refresh pending AWB" : "No AWB Available"}
            >
              {order.easyparcelBookingStatus === "awb_pending" && !awbPrintUrl ? <RefreshCw className={`w-4 h-4 text-amber-600 ${isRefreshingShipment ? "animate-spin" : ""}`} /> : <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </button>
            <button 
              onClick={() => handleMinimizedChange(!isMinimized)}
              className="p-1.5 bg-muted rounded-full hover:bg-muted/80 text-muted-foreground transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
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
                onClick={handleArchiveToggle}
                disabled={isArchiving}
                className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                title={order.isArchived ? "Unarchive Order" : "Archive Order"}
              >
                {order.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
              </button>
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
        </>
      )}
      {!onOpenShipmentDialog && (
        <EasyParcelShipmentDialog order={order} open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen} />
      )}
    </Card>
  );
};

export default OrderCard;
