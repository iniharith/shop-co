"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, IndianRupee, MapPin, Truck } from "lucide-react";
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
import AnimatedButton from "../globalButton";
import { useUpdateOrderStatus } from "@/hooks/useOrder";
import { IOrder } from "@/types/IOrder";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { IUser, Roles } from "@/types/api";

interface OrderDetailsModalProps {
  order: IOrder;
}

const OrderInfo = ({ order }: OrderDetailsModalProps) => {
  const [status, setStatus] = useState<any>(order.orderStatus);
  const { data: session } = useSession();

  const statusOptions = [
    "PLACED",
    "PENDING_ARTWORK",
    "ARTWORK_REVIEW",
    "ARTWORK_REJECTED",
    "IN_DESIGN",
    "IN_PRODUCTION",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
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
      case "ARTWORK_REVIEW":
        return "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 cursor-pointer text-blue-700 dark:text-blue-300";
      case "ARTWORK_REJECTED":
        return "bg-red-500/20 border-red-500/40 hover:bg-red-500/40 cursor-pointer text-red-700 dark:text-red-300";
      case "IN_DESIGN":
        return "bg-indigo-500/20 border-indigo-500/40 hover:bg-indigo-500/30 cursor-pointer text-indigo-700 dark:text-indigo-300";
      case "IN_PRODUCTION":
        return "bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30 cursor-pointer text-teal-700 dark:text-teal-300";
      case "SHIPPED":
        return "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/40 cursor-pointer";
      case "IN_TRANSIT":
        return "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/40 cursor-pointer text-blue-800 dark:text-blue-200";
      case "DELIVERED":
        return "bg-green-500/20 border-green-500/40 hover:bg-green-500/40 cursor-pointer";
      case "CANCELLED":
        return "bg-red-500/20 border-red-500/40 hover:bg-red-500/40 cursor-pointer text-red-700 dark:text-red-300";
      default:
        return "bg-gray-500/20 border-gray-500/40 hover:bg-gray-500/40 cursor-pointer";
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
              
              {(status as string === "PENDING_ARTWORK" || status as string === "ARTWORK_REVIEW") && (
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

      <div className="p-4 mb-2  bg-muted/20 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin size={16} /> Shipping Address
        </h3>
        <p className="px-1 text-muted-foreground">
          {order.address?.address}, {order.address?.postalCode}
        </p>
      </div>

      <p className="font-semibold text-lg flex items-center gap-1">
        Grand Total: RM{order.totalAmount}
      </p>
    </ScrollArea>
  );
};

export default OrderInfo;
