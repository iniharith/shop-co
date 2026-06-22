"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCreateManualOrder } from "@/hooks/useOrder";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ open, onOpenChange }) => {
  const { mutate: createOrder, isPending } = useCreateManualOrder();
  const { data: productsData } = useProducts();
  const fetchedProducts = (productsData as any)?.products || [];
  const defaultProducts = [
    { _id: 'dp-1', name: "Banner" }, { _id: 'dp-2', name: "Bunting" }, { _id: 'dp-3', name: "Car Sticker" },
    { _id: 'dp-4', name: "Board Printing" }, { _id: 'dp-5', name: "Wall Sticker" }, { _id: 'dp-6', name: "Glass Sticker" },
    { _id: 'dp-7', name: "Personalised Flag" }, { _id: 'dp-8', name: "Popup Backdrop Display" }, { _id: 'dp-9', name: "Roll Up Stand" },
    { _id: 'dp-10', name: "Name Card" }, { _id: 'dp-11', name: "Flyer / Brochure" }, { _id: 'dp-12', name: "Postcard" },
    { _id: 'dp-13', name: "Greeting Card" }, { _id: 'dp-14', name: "Booklet" }, { _id: 'dp-15', name: "Letterhead" },
    { _id: 'dp-16', name: "Envelope" }, { _id: 'dp-17', name: "Folded Business Card" }, { _id: 'dp-18', name: "Poster" },
    { _id: 'dp-19', name: "Ticket" }, { _id: 'dp-20', name: "Wobbler" }, { _id: 'dp-21', name: "Tag" },
    { _id: 'dp-22', name: "Paper Bag" }, { _id: 'dp-23', name: "Non Woven Bag" }, { _id: 'dp-24', name: "Canvas Bag" },
    { _id: 'dp-25', name: "Label Sticker" }, { _id: 'dp-26', name: "Paper Box" }, { _id: 'dp-27', name: "Mug" },
    { _id: 'dp-28', name: "T-Shirt" }, { _id: 'dp-29', name: "Uniform" }, { _id: 'dp-30', name: "Lanyard" }
  ];
  const products = fetchedProducts.length > 0 ? fetchedProducts : defaultProducts;
  const [openProductBox, setOpenProductBox] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    platform: "WEB",
    totalAmount: "",
    status: "pending",
    fullAddress: "",
    trackingNumber: "",
    courier: "none",
    productChoice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.totalAmount) {
      toast.error("Customer Name/ID and Total Amount are required");
      return;
    }

    const payload = {
      userId: formData.userId,
      customerName: formData.userId, // Sending input as customerName too
      platform: formData.platform,
      totalAmount: parseFloat(formData.totalAmount),
      status: formData.status,
      products: [], // Empty products for manual orders by default or can add items
      orderNotes: formData.productChoice ? `Product: ${formData.productChoice}` : "",
      trackingNumber: formData.trackingNumber,
      courier: formData.courier === "none" ? undefined : formData.courier,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID", 
      address: {
        address: formData.fullAddress || "Manual Entry",
        street: formData.fullAddress || "Manual Entry",
        city: "Manual Entry",
        country: "Malaysia",
        postalCode: "00000"
      }
    };

    createOrder(payload, {
      onSuccess: () => {
        toast.success("Manual order created successfully");
        onOpenChange(false);
        setFormData({ userId: "", platform: "WEB", totalAmount: "", status: "pending", fullAddress: "", trackingNumber: "", courier: "none", productChoice: "" });
        window.location.reload();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create manual order");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add External/Manual Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer Name / User ID *</Label>
            <Input 
              value={formData.userId} 
              onChange={e => setFormData({ ...formData, userId: e.target.value })} 
              placeholder="e.g. 64a1b..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={formData.platform} onValueChange={v => setFormData({ ...formData, platform: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEB">KampungCetak (WEB)</SelectItem>
                <SelectItem value="TIKTOK">TikTok Shop</SelectItem>
                <SelectItem value="SHOPEE">Shopee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Product Choice</Label>
            <Popover open={openProductBox} onOpenChange={setOpenProductBox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProductBox}
                  className="w-full justify-between font-normal"
                >
                  {formData.productChoice
                    ? formData.productChoice
                    : "Select or type product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or type product..." 
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList className="max-h-[250px] overflow-y-auto">
                    <CommandEmpty>
                       {productSearch ? (
                         <div
                           className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted rounded-sm text-sm"
                           onClick={() => {
                             setFormData({ ...formData, productChoice: productSearch });
                             setOpenProductBox(false);
                             setProductSearch("");
                           }}
                         >
                           <Plus className="h-4 w-4 text-primary" />
                           Use "{productSearch}"
                         </div>
                       ) : (
                         "No matching product found."
                       )}
                    </CommandEmpty>
                    <CommandGroup>
                      {productSearch && !products.some((p: any) => p.name.toLowerCase() === productSearch.toLowerCase()) && (
                        <CommandItem
                          value={productSearch}
                          onSelect={() => {
                            setFormData({ ...formData, productChoice: productSearch });
                            setOpenProductBox(false);
                            setProductSearch("");
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4 text-primary" />
                          Use "{productSearch}"
                        </CommandItem>
                      )}
                      {products.map((product: any) => (
                        <CommandItem
                          key={product._id}
                          value={product.name}
                          onSelect={() => {
                            setFormData({ ...formData, productChoice: product.name });
                            setOpenProductBox(false);
                            setProductSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.productChoice === product.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Tracking Number (Optional)</Label>
            <Input 
              value={formData.trackingNumber} 
              onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })} 
              placeholder="e.g. MY123456789" 
            />
          </div>
          <div className="space-y-2">
            <Label>Courier (Optional)</Label>
            <Select value={formData.courier} onValueChange={v => setFormData({ ...formData, courier: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="J&T Express">J&T Express</SelectItem>
                <SelectItem value="PosLaju">PosLaju</SelectItem>
                <SelectItem value="Ninja Van">Ninja Van</SelectItem>
                <SelectItem value="GDEX">GDEX</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
                <SelectItem value="City-Link Express">City-Link Express</SelectItem>
                <SelectItem value="Flash Express">Flash Express</SelectItem>
                <SelectItem value="Shopee Express">Shopee Express</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total Amount (RM) *</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.totalAmount} 
              onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} 
              placeholder="0.00" 
            />
          </div>
          <div className="space-y-2">
            <Label>Initial Status</Label>
            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Full Address</Label>
            <Textarea 
              value={formData.fullAddress} 
              onChange={e => setFormData({ ...formData, fullAddress: e.target.value })} 
              placeholder="e.g. No 12, Jalan 3/4..." 
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
