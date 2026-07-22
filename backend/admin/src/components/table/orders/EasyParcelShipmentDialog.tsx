"use client";

import { useEffect, useState } from "react";
import { Loader2, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { IOrder } from "@/types/IOrder";
import { useCreateShipment, useEasyParcelStatus, useShippingQuotations } from "@/hooks/useOrder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShipmentDialogProps {
  order: IOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PackageDetails {
  weight: number;
  width: number;
  length: number;
  height: number;
  collectionDate: string;
  customerPhone: string;
  customerEmail: string;
}

interface Quotation {
  courier: {
    service_id: string;
    service_name?: string;
    courier_name?: string;
    courier_logo?: string;
    delivery_duration?: string | null;
    is_pickup?: boolean;
    is_dropoff?: boolean;
  };
  pricing: {
    currency?: string;
    total_amount?: string;
    shipment_price?: string;
  };
}

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export default function EasyParcelShipmentDialog({ order, open, onOpenChange }: ShipmentDialogProps) {
  const user = order.userId as any;
  const [details, setDetails] = useState<PackageDetails>({
    weight: 1,
    width: 20,
    length: 30,
    height: 10,
    collectionDate: tomorrow(),
    customerPhone: order.shippingCustomerPhone || user?.phoneNumber || "",
    customerEmail: order.shippingCustomerEmail || user?.email || "",
  });
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const { data: connection, isPending: checkingConnection } = useEasyParcelStatus();
  const { mutate: fetchQuotations, isPending: fetchingQuotations } = useShippingQuotations();
  const { mutate: createShipment, isPending: creatingShipment } = useCreateShipment();
  const connectionData = connection as any;

  useEffect(() => {
    if (!open) return;
    setDetails((current) => ({
      ...current,
      collectionDate: tomorrow(),
      customerPhone: order.shippingCustomerPhone || user?.phoneNumber || current.customerPhone,
      customerEmail: order.shippingCustomerEmail || user?.email || current.customerEmail,
    }));
    setQuotations([]);
    setSelectedServiceId("");
  }, [open, order.shippingCustomerEmail, order.shippingCustomerPhone, user?.email, user?.phoneNumber]);

  const packagePayload = {
    weight: details.weight,
    width: details.width,
    length: details.length,
    height: details.height,
    customerPhone: details.customerPhone,
    customerEmail: details.customerEmail,
  };

  const handleGetRates = () => {
    fetchQuotations({ orderId: order._id, data: packagePayload }, {
      onSuccess: (response: any) => {
        const groups = Array.isArray(response?.quotations) ? response.quotations : [];
        const rates = groups.flatMap((group: any) => Array.isArray(group?.quotations) ? group.quotations : []);
        setQuotations(rates);
        setSelectedServiceId(rates[0]?.courier?.service_id || "");
        if (!rates.length) toast.error("No courier quotation is available for this parcel");
      },
      onError: (error: any) => toast.error(error.response?.data?.message || error.message || "Failed to get EasyParcel quotations"),
    });
  };

  const handleCreateAwb = () => {
    if (!selectedServiceId) {
      toast.error("Select a courier first");
      return;
    }
    if (!details.customerPhone.trim()) {
      toast.error("Customer phone number is required");
      return;
    }

    createShipment({
      orderId: order._id,
      data: {
        ...packagePayload,
        serviceId: selectedServiceId,
        collectionDate: details.collectionDate,
      },
    }, {
      onSuccess: (response: any) => {
        const pending = response?.order?.easyparcelBookingStatus === "awb_pending";
        toast.success(pending ? "Shipment booked. AWB is pending from EasyParcel." : "Shipment and AWB created successfully");
        onOpenChange(false);
      },
      onError: (error: any) => toast.error(error.response?.data?.message || error.message || "Failed to create EasyParcel shipment"),
    });
  };

  const updateNumber = (key: keyof Pick<PackageDetails, "weight" | "width" | "length" | "height">, value: string) => {
    setDetails((current) => ({ ...current, [key]: Number(value) }));
    setQuotations([]);
    setSelectedServiceId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5" /> Create EasyParcel AWB</DialogTitle>
          <DialogDescription>
            Booking for order {order._id.slice(-8).toUpperCase()}. Confirm the packed parcel measurements before selecting a courier. Submission charges the connected EasyParcel wallet.
          </DialogDescription>
        </DialogHeader>

        {checkingConnection ? (
          <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !connectionData?.configured ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            EasyParcel backend configuration is incomplete. Configure OAuth, token encryption, redirect URI and sender environment variables first.
          </div>
        ) : !connectionData?.connected ? (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
            An EasyParcel account is not connected yet. Use the Connect EasyParcel button at the top of the Orders page.
          </div>
        ) : !connectionData?.shippingConfigured ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            Sender configuration is incomplete: {(connectionData?.missingShippingConfiguration || []).join(", ")}. Add these variables in Railway before requesting rates.
          </div>
        ) : (
          <>
            {connectionData?.environment === "sandbox" && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
                Sandbox mode: booking can generate a test shipment and AWB, but tracking status may remain static.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="ep-weight">Weight (kg)</Label><Input id="ep-weight" type="number" min="0.01" step="0.01" value={details.weight} onChange={(event) => updateNumber("weight", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="ep-width">Width (cm)</Label><Input id="ep-width" type="number" min="0.1" step="0.1" value={details.width} onChange={(event) => updateNumber("width", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="ep-length">Length (cm)</Label><Input id="ep-length" type="number" min="0.1" step="0.1" value={details.length} onChange={(event) => updateNumber("length", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="ep-height">Height (cm)</Label><Input id="ep-height" type="number" min="0.1" step="0.1" value={details.height} onChange={(event) => updateNumber("height", event.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="ep-phone">Customer phone</Label><Input id="ep-phone" value={details.customerPhone} onChange={(event) => setDetails((current) => ({ ...current, customerPhone: event.target.value }))} placeholder="0123456789" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="ep-email">Customer email</Label><Input id="ep-email" type="email" value={details.customerEmail} onChange={(event) => setDetails((current) => ({ ...current, customerEmail: event.target.value }))} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="ep-date">Collection date</Label><Input id="ep-date" type="date" min={new Date().toISOString().slice(0, 10)} value={details.collectionDate} onChange={(event) => setDetails((current) => ({ ...current, collectionDate: event.target.value }))} /></div>
              <div className="flex items-end sm:col-span-2"><Button type="button" variant="outline" className="w-full" onClick={handleGetRates} disabled={fetchingQuotations}>{fetchingQuotations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}Get Courier Rates</Button></div>
            </div>

            {quotations.length > 0 && (
              <div className="space-y-3">
                <Label>Select courier</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {quotations.map((quotation) => {
                    const serviceId = quotation.courier.service_id;
                    const selected = selectedServiceId === serviceId;
                    return (
                      <button key={serviceId} type="button" onClick={() => setSelectedServiceId(serviceId)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary/40"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-semibold">{quotation.courier.courier_name || "Courier"}</p><p className="mt-1 text-xs text-muted-foreground">{quotation.courier.service_name || serviceId}</p></div>
                          <p className="font-bold">{quotation.pricing.currency || "MYR"} {quotation.pricing.total_amount || quotation.pricing.shipment_price || "-"}</p>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">{quotation.courier.delivery_duration || "Delivery estimate unavailable"}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleCreateAwb} disabled={!connectionData?.connected || !selectedServiceId || creatingShipment}>
            {creatingShipment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create AWB
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
