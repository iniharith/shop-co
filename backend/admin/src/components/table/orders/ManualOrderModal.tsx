"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateManualOrder } from "@/hooks/useOrder";
import { toast } from "sonner";

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ open, onOpenChange }) => {
  const { mutate: createOrder, isPending } = useCreateManualOrder();

  const [formData, setFormData] = useState({
    userId: "",
    platform: "WEB",
    totalAmount: "",
    status: "pending",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.totalAmount) {
      toast.error("User ID and Total Amount are required");
      return;
    }

    const payload = {
      userId: formData.userId,
      platform: formData.platform,
      totalAmount: parseFloat(formData.totalAmount),
      status: formData.status,
      products: [], // Empty products for manual orders by default or can add items
      paymentMethod: "ONLINE",
      paymentStatus: "PAID", 
      address: {
        address: "Manual Entry",
        street: "Manual Entry",
        city: "Manual Entry",
        country: "Manual Entry",
        postalCode: "00000"
      }
    };

    createOrder(payload, {
      onSuccess: () => {
        toast.success("Manual order created successfully");
        onOpenChange(false);
        setFormData({ userId: "", platform: "WEB", totalAmount: "", status: "pending" });
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
            <Label>User ID / Customer ID *</Label>
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
