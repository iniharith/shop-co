/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, IndianRupee, MapPin, Truck, Link2, Unlink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import AnimatedButton from "../globalButton";
import { useUpdateOrderStatus } from "@/hooks/useOrder";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { IOrder } from "@/types/IOrder";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { IUser, Roles } from "@/types/api";
import { toast } from "sonner";

interface OrderDetailsModalProps {
  order: IOrder;
}

const OrderInfo = ({ order }: OrderDetailsModalProps) => {
  const [status, setStatus] = useState<any>(order.orderStatus);
  const { data: session } = useSession();

  const statusOptions = [
    "PLACED",
    "IN_PROGRESS",
    "PENDING_ARTWORK",
    "ARTWORK_REVIEWED",
    "ARTWORK_REJECTED",
    "IN_DESIGN",
    "PEMBETULAN",
    "DONE_DESIGN",
    "IN_PRODUCTION",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "FAILED",
  ];

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateStatus({
      id: (order as any)._id,
      status: newStatus,
    });
  };

  const { mutate: updateStatus, isPending: statusPending } =
    useUpdateOrderStatus();



  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLACED":
        return "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
      case "PENDING_ARTWORK":
        return "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30 cursor-pointer text-orange-700 dark:text-orange-300";
      case "ARTWORK_REVIEWED":
        return "bg-purple-100 text-purple-800";
      case "ARTWORK_REJECTED":
        return "bg-red-100 text-red-800";
      case "DONE_DESIGN":
        return "bg-emerald-100 text-emerald-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PEMBETULAN":
        return "bg-rose-100 text-rose-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "IN_DESIGN":
        return "bg-indigo-500/20 border-indigo-500/40 hover:bg-indigo-500/30 cursor-pointer text-indigo-700 dark:text-indigo-300";

      case "IN_PRODUCTION":
        return "bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30 cursor-pointer text-teal-700 dark:text-teal-300";
      case "SHIPPED":
        return "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/40 cursor-pointer text-purple-700 dark:text-purple-300";
      case "IN_TRANSIT":
        return "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/40 cursor-pointer text-blue-700 dark:text-blue-300";
      case "DELIVERED":
        return "bg-green-500/20 border-green-500/40 hover:bg-green-500/40 cursor-pointer text-green-700 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-500/20 border-red-500/40 hover:bg-red-500/40 cursor-pointer text-red-700 dark:text-red-300";
      default:
        return "bg-gray-500/20 border-gray-500/40 hover:bg-gray-500/40 cursor-pointer text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <ScrollArea className="max-h-[600px] w-full  space-y-4">
      <div className="relative cursor-grab  overflow-hidden md:w-[90%] w-full">
        <Carousel
          className=" w-full"
          opts={{
            align: "start",
            // loop: true,
          }}
        >
          <CarouselContent>
            {order.products.map((product) => (
              <CarouselItem
                key={product.product._id}
                className=" w-full shrink-0 "
              >
                <div className="flex gap-4">
                  <Avatar className="w-32 h-32 object-cover relative  rounded-lg">
                    <AvatarImage
                      className="object-cover"
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${product.product.images[0]}`}
                      alt={product.product.name}
                    />
                    <AvatarFallback>
                      {product.product.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">
                      {product.product.name}
                    </p>
                    <p className="text-gray-600 flex items-center gap-1">
                      RM{product.price}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {product.quantity}
                    </p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar size={16} /> Order Created On:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>

                    {product.artworkUrl && (
                      <div className="mt-3">
                        <a 
                          href={product.artworkUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold text-sm hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
                        >
                          View Uploaded Artwork
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="flex md:flex-row  flex-col mb-2 mt-2 md:items-center justify-between gap-4 py-4 px-4 bg-muted/20 rounded-lg">
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>{order.customerName?.slice(0, 2) || (order.userId as any)?.name?.slice(0, 2) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{order.customerName || (order.userId as any)?.name || "Unknown User"}</p>
            <p className="text-gray-600">{(order.userId as any)?.email || ""}</p>
          </div>
        </div>
        {session?.user?.id && (
            <div className="flex flex-col items-end gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Truck size={16} />
                <Select
                  disabled={statusPending}
                  onValueChange={handleStatusChange}
                  defaultValue={status}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        <Badge
                          className={`${getStatusColor(
                            order.orderStatus
                          )} text-white`}
                        >
                          {order.orderStatus}
                        </Badge>
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        <Badge
                          className={`${getStatusColor(option)} text-white `}
                        >
                          {option}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(status as string === "PENDING_ARTWORK" || status as string === "ARTWORK_REVIEWED") && (
                <div className="flex gap-2 mt-2">
                  <button 
                    disabled={statusPending}
                    onClick={() => handleStatusChange("IN_DESIGN")}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-colors disabled:opacity-50"
                  >
                    Approve & Push to Designer
                  </button>
                  <button 
                    disabled={statusPending}
                    onClick={() => handleStatusChange("ARTWORK_REJECTED")}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-colors disabled:opacity-50"
                  >
                    Reject Artwork
                  </button>
                </div>
              )}

              {status as string === "IN_DESIGN" && (
                <div className="flex gap-2 mt-2">
                  <button 
                    disabled={statusPending}
                    onClick={() => handleStatusChange("IN_PRODUCTION")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-colors disabled:opacity-50"
                  >
                    Proceed to Print (Production)
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
      
      {/* Progress Bar Timeline */}
      <div className="py-5 px-5 bg-white dark:bg-black/20 rounded-lg mt-4 mb-4 border border-gray-100 dark:border-border/50 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Truck className="w-4 h-4" /> Order Tracking Progress
        </h3>
        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {status !== "CANCELLED" ? (() => {
            const getProgressStep = (currentStatus: string) => {
              switch (currentStatus) {
                case "PLACED":
                case "PENDING_ARTWORK":
                case "ARTWORK_REJECTED": return 0; // Placed
                case "ARTWORK_REVIEWED":
                case "IN_DESIGN": return 1; // Design
                case "IN_PRODUCTION": return 2; // Print
                case "SHIPPED":
                case "IN_TRANSIT": return 3; // Transit
                case "DELIVERED": return 4; // Delivered
                default: return 0;
              }
            };
            const step = getProgressStep(status);
            return (
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${step === 4 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${(step / 4) * 100}%` }}
              />
            );
          })() : (
            <div className="absolute top-0 left-0 h-full w-full rounded-full bg-rose-500" />
          )}
        </div>
        <div className="flex justify-between mt-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          {(() => {
            const step = status === "CANCELLED" ? -1 : (() => {
              switch (status) {
                case "PLACED":
                case "PENDING_ARTWORK":
                case "ARTWORK_REJECTED": return 0;
                case "ARTWORK_REVIEWED":
                case "IN_DESIGN": return 1;
                case "IN_PRODUCTION": return 2;
                case "SHIPPED":
                case "IN_TRANSIT": return 3;
                case "DELIVERED": return 4;
                default: return 0;
              }
            })();
            return (
              <>
                <span className={step >= 0 ? "text-blue-600 dark:text-blue-400" : ""}>Placed</span>
                <span className={step >= 1 ? "text-blue-600 dark:text-blue-400" : ""}>Design</span>
                <span className={step >= 2 ? "text-blue-600 dark:text-blue-400" : ""}>Print</span>
                <span className={step >= 3 ? "text-blue-600 dark:text-blue-400" : ""}>Transit</span>
                <span className={step >= 4 ? "text-emerald-600 dark:text-emerald-400" : ""}>Delivered</span>
              </>
            );
          })()}
        </div>
      </div>

      <div className="p-4 mb-2  bg-muted/20 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin size={16} /> Shipping Address
        </h3>
        <p className="px-1 text-muted-foreground">
          {order.address?.address}, {order.address?.postalCode}
        </p>
      </div>

      <div className="p-4 mb-2 bg-muted/20 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Link2 size={16} /> Linked Tasks
          </h3>
          <LinkTaskPopover orderId={(order as any)._id} />
        </div>
        <LinkedTasksList orderId={(order as any)._id} />
      </div>

      <p className="font-semibold text-lg flex items-center gap-1">
        Grand Total: RM{order.totalAmount}
      </p>
    </ScrollArea>
  );
};

const LinkedTasksList = ({ orderId }: { orderId: string }) => {
  const { data, isPending } = useTasks({ orderId }, true);
  const { mutate: updateTask, isPending: unlinking } = useUpdateTask();
  const tasks = (data as any)?.tasks || [];

  const handleUnlink = (taskId: string) => {
    updateTask(
      { id: taskId, data: { orderId: "" } },
      { onSuccess: () => toast.success("Task unlinked") }
    );
  };

  if (isPending) return <p className="text-xs text-muted-foreground">Loading tasks...</p>;
  if (tasks.length === 0) return <p className="text-xs text-muted-foreground">No tasks linked to this order yet.</p>;

  return (
    <div className="space-y-2">
      {tasks.map((task: any) => (
        <div key={task._id} className="flex items-center justify-between gap-2 p-2 bg-background rounded-md border">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 text-[10px]">{task.status}</Badge>
            <span className="text-sm truncate">{task.title}</span>
          </div>
          <button
            disabled={unlinking}
            onClick={() => handleUnlink(task._id)}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            title="Unlink task"
          >
            <Unlink size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const LinkTaskPopover = ({ orderId }: { orderId: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const { data: unlinkedData, isPending } = useTasks({ unlinked: "true", search: search || undefined }, open);
  const { mutate: updateTask, isPending: linking } = useUpdateTask();
  const unlinkedTasks = (unlinkedData as any)?.tasks || [];

  const handleLink = (taskId: string) => {
    updateTask(
      { id: taskId, data: { orderId } },
      {
        onSuccess: () => {
          toast.success("Task linked to this order");
          setOpen(false);
          setSearch("");
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <Link2 size={12} /> Link Task
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search unlinked tasks..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandEmpty>
              {isPending ? "Searching..." : "No unlinked tasks found."}
            </CommandEmpty>
            <CommandGroup>
              {unlinkedTasks.map((task: any) => (
                <CommandItem
                  key={task._id}
                  value={task._id}
                  onSelect={() => handleLink(task._id)}
                  disabled={linking}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className="shrink-0 text-[10px]">{task.status}</Badge>
                    <span className="text-sm truncate">{task.title}</span>
                  </div>
                  {linking && <Loader2 size={12} className="animate-spin shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OrderInfo;
