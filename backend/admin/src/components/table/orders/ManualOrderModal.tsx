/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCreateManualOrder } from "@/hooks/useOrder";
import { useProducts } from "@/hooks/useProducts";
import { getPublicShippingQuote } from "@/api/orders";
import { TASK_CATEGORIES, productToTaskCategory } from "@/constants/taskCategories";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Package, Plus, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData = {
  customerName: "",
  userId: "",
  platform: "WEB",
  orderStatus: "PLACED",
  address1: "",
  address2: "",
  postcode: "",
  city: "",
  state: "MY-01",
  customerPhone: "",
  customerEmail: "",
  courier: "none",
  productDescription: "",
};

type OrderProductItem = { productChoice: string; productCategory: string; productId: string };
const emptyProductItem = (): OrderProductItem => ({ productChoice: "", productCategory: "", productId: "" });

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ open, onOpenChange }) => {
  const { mutate: createOrder, isPending } = useCreateManualOrder();
  const { data: session } = useSession();

  // One task can now cover more than one product/category — each row here
  // becomes an entry in the task's lineItems, with the first row staying the
  // primary product/category (same fields the rest of the system expects).
  const [items, setItems] = useState<OrderProductItem[]>([emptyProductItem()]);
  const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
  const [rowSearch, setRowSearch] = useState("");

  const updateItem = (idx: number, patch: Partial<OrderProductItem>) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItemRow = () => setItems(prev => [...prev, emptyProductItem()]);
  const removeItemRow = (idx: number) => setItems(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const [formData, setFormData] = useState(initialFormData);

  // Same catalog lookup + category mapping as the "New Task" dialog, so
  // picking a real product here resolves to the exact same task category.
  const { data: productsData } = useProducts();
  const taskProducts = React.useMemo(
    () =>
      ((productsData as any)?.products || [])
        .filter((p: any) => p && p.name)
        .map((p: any) => ({
          id: p._id,
          name: p.name,
          category: productToTaskCategory(p),
          sections: p.sections || [],
          searchKey: `${p.name} ${p.category || ""} ${(p.sections || []).join(" ")} ${productToTaskCategory(p)}`.toLowerCase(),
        })),
    [productsData]
  );

  // Shipping quote state
  const [shippingQuote, setShippingQuote] = useState<{ courier: string; fee: number; serviceId?: string } | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);
  const lastQuoteKey = useRef<string>("");

  const postcodeValid = /^\d{5}$/.test(formData.postcode);
  const stateValid = !!formData.state;

  useEffect(() => {
    if (!open) return;
    const key = `${formData.postcode}|${formData.state}`;
    if (key === lastQuoteKey.current) return;
    if (!postcodeValid || !stateValid) {
      setShippingQuote(null);
      setShippingError(null);
      lastQuoteKey.current = "";
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      lastQuoteKey.current = key;
      setShippingLoading(true);
      setShippingError(null);
      quoteAbortRef.current?.abort();
      const controller = new AbortController();
      quoteAbortRef.current = controller;
      try {
        const token = session?.user?.token || "";
        const data = await getPublicShippingQuote(token, {
          postalCode: formData.postcode,
          state: formData.state,
          weight: 1,
          width: 20,
          length: 30,
          height: 5,
        });
        if (cancelled || controller.signal.aborted) return;
        const groups = Array.isArray((data as any)?.quotations) ? (data as any).quotations : [];
        const quotations = groups.flatMap((group: any) =>
          Array.isArray(group?.quotations) ? group.quotations : Array.isArray(group) ? group : []
        );
        if (quotations.length === 0) {
          setShippingQuote(null);
          setShippingError((data as any)?.error || "No shipping options available for this address");
        } else {
          const getQuotationPrice = (q: any) => Number(q?.pricing?.total_amount || q?.pricing?.shipment_price || q?.price || q?.total_amount || q?.shipping_price) || Infinity;
          const cheapest = quotations.reduce((min: any, q: any) => {
            return getQuotationPrice(q) < getQuotationPrice(min) ? q : min;
          });
          setShippingQuote({
            courier: cheapest?.courier?.courier_name || cheapest?.courier?.service_name || cheapest?.courier_name || "Unknown",
            fee: getQuotationPrice(cheapest),
            serviceId: cheapest.service_id,
          });
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== "CanceledError" && err?.name !== "AbortError") {
          setShippingQuote(null);
          setShippingError(err?.response?.data?.message || "Failed to calculate shipping");
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); quoteAbortRef.current?.abort(); };
  }, [formData.postcode, formData.state, open, session?.user?.token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerPhone || !formData.address1 || !formData.postcode || !formData.city) {
      toast.error("Customer, phone and complete shipping address are required");
      return;
    }
    if (!/^\d{5}$/.test(formData.postcode)) {
      toast.error("Malaysian postcode must contain 5 digits");
      return;
    }

    const primaryItem = items[0] || emptyProductItem();
    const lineItems = items
      .filter(it => it.productChoice.trim())
      .map(it => ({
        productId: it.productId || undefined,
        productName: it.productChoice.trim(),
        category: it.productCategory || undefined,
      }));

    const payload = {
      userId: formData.userId,
      customerName: formData.customerName,
      platform: formData.platform,
      totalAmount: 0,
      orderStatus: formData.orderStatus,
      products: [],
      productChoice: primaryItem.productChoice || undefined,
      productDescription: formData.productDescription || undefined,
      productCategory: primaryItem.productCategory || undefined,
      productId: primaryItem.productId || undefined,
      // Full product/category breakdown — lets the auto-created task cover
      // more than one product type in a single order.
      lineItems,
      orderNotes: primaryItem.productChoice ? `Product: ${primaryItem.productChoice}` : "",
      courier: formData.courier === "none" ? undefined : formData.courier,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      shippingCustomerPhone: formData.customerPhone,
      shippingCustomerEmail: formData.customerEmail || undefined,
      address: {
        address: formData.address2 || formData.address1,
        street: formData.address1,
        city: formData.city,
        state: formData.state,
        country: "MY",
        postalCode: formData.postcode,
      }
    };

    createOrder(payload, {
      onSuccess: () => {
        toast.success("Manual order created successfully");
        onOpenChange(false);
        setFormData(initialFormData);
        setItems([emptyProductItem()]);
        window.location.reload();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create manual order");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add External/Manual Order</DialogTitle>
                <DialogDescription className="sr-only">Dialog Content</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Customer or company name" />
            </div>
            <div className="space-y-2">
              <Label>Linked User ID</Label>
              <Input value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })} placeholder="Optional Mongo user ID" />
            </div>
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
            <div className="flex items-center justify-between">
              <Label>Product / Category</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add another product
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Popover
                  open={openRowIndex === idx}
                  onOpenChange={(v) => { setOpenRowIndex(v ? idx : null); setRowSearch(""); }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRowIndex === idx}
                      className="w-full justify-between font-normal"
                    >
                      {item.productChoice || "Select or type product..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or type product..."
                        value={rowSearch}
                        onValueChange={setRowSearch}
                      />
                      <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty>
                           {rowSearch ? (
                             <div
                               className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted rounded-sm text-sm"
                               onClick={() => {
                                 updateItem(idx, { productChoice: rowSearch, productCategory: "", productId: "" });
                                 setOpenRowIndex(null);
                                 setRowSearch("");
                               }}
                             >
                               <Plus className="h-4 w-4 text-primary" />
                               Use "{rowSearch}"
                             </div>
                           ) : (
                             "No matching product found."
                           )}
                        </CommandEmpty>
                        {rowSearch && !TASK_CATEGORIES.some(c => c.toLowerCase() === rowSearch.toLowerCase()) && (
                          <CommandGroup>
                            <CommandItem
                              value={rowSearch}
                              onSelect={() => {
                                updateItem(idx, { productChoice: rowSearch, productCategory: "", productId: "" });
                                setOpenRowIndex(null);
                                setRowSearch("");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4 text-primary" />
                              Use "{rowSearch}"
                            </CommandItem>
                          </CommandGroup>
                        )}
                        <CommandGroup heading="Categories">
                          {TASK_CATEGORIES.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => {
                                updateItem(idx, { productChoice: category, productCategory: category, productId: "" });
                                setOpenRowIndex(null);
                                setRowSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  item.productChoice === category ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {taskProducts.length > 0 && (
                          <CommandGroup heading="Products">
                            {taskProducts.map((product: any) => (
                              <CommandItem
                                key={product.id}
                                value={product.searchKey}
                                onSelect={() => {
                                  updateItem(idx, {
                                    productChoice: product.name,
                                    productCategory: product.category,
                                    productId: product.id,
                                  });
                                  setOpenRowIndex(null);
                                  setRowSearch("");
                                }}
                              >
                                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                {product.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {product.sections.join(", ") || product.category}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItemRow(idx)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
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
            <Label>Initial Status</Label>
            <Select value={formData.orderStatus} onValueChange={v => setFormData({ ...formData, orderStatus: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLACED">Placed</SelectItem>
                <SelectItem value="DONE_PRINTING">Done Printing</SelectItem>
                <SelectItem value="PACKAGING">Packaging (Ready for AWB)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">EasyParcel Create AWB becomes available when the paid order is Done Printing or Packaging.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer Phone *</Label>
              <Input value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="01116141946" />
            </div>
            <div className="space-y-2">
              <Label>Customer Email</Label>
              <Input type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} placeholder="customer@example.com" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address Line 1 *</Label>
              <Textarea value={formData.address1} onChange={e => setFormData({ ...formData, address1: e.target.value })} placeholder="No. 12, Jalan..." rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address Line 2</Label>
              <Input value={formData.address2} onChange={e => setFormData({ ...formData, address2: e.target.value })} placeholder="Building, area or unit (optional)" />
            </div>
            <div className="space-y-2">
              <Label>Postcode *</Label>
              <Input inputMode="numeric" maxLength={5} value={formData.postcode} onChange={e => setFormData({ ...formData, postcode: e.target.value.replace(/\D/g, "") })} placeholder="81750" />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Masai" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>State *</Label>
              <Select value={formData.state} onValueChange={v => setFormData({ ...formData, state: v })}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MY-01">Johor</SelectItem><SelectItem value="MY-02">Kedah</SelectItem><SelectItem value="MY-03">Kelantan</SelectItem><SelectItem value="MY-04">Melaka</SelectItem>
                  <SelectItem value="MY-05">Negeri Sembilan</SelectItem><SelectItem value="MY-06">Pahang</SelectItem><SelectItem value="MY-07">Pulau Pinang</SelectItem><SelectItem value="MY-08">Perak</SelectItem>
                  <SelectItem value="MY-09">Perlis</SelectItem><SelectItem value="MY-10">Selangor</SelectItem><SelectItem value="MY-11">Terengganu</SelectItem><SelectItem value="MY-12">Sabah</SelectItem>
                  <SelectItem value="MY-13">Sarawak</SelectItem><SelectItem value="MY-14">Kuala Lumpur</SelectItem><SelectItem value="MY-15">Labuan</SelectItem><SelectItem value="MY-16">Putrajaya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(shippingLoading || shippingQuote || shippingError) && (
            <div className="p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Truck size={14} />
                <span>Estimated Shipping Fee</span>
              </div>
              <div className="mt-1">
                {shippingLoading ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Calculating...</p>
                ) : shippingQuote ? (
                  <p className="text-sm">
                    <span className="font-semibold">{shippingQuote.courier}</span>
                    <span className="text-muted-foreground mx-1">—</span>
                    <span className="font-bold">RM{shippingQuote.fee.toFixed(2)}</span>
                  </p>
                ) : shippingError ? (
                  <p className="text-xs text-destructive">{shippingError}</p>
                ) : null}
              </div>
            </div>
          )}
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
