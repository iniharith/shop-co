/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Cable, CheckCircle2, Loader2, Plus, Search } from "lucide-react";
import { SearchParams } from "nuqs/server";
import { SheetReuse } from "@/components/global/sheet";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import AnimatedButton from "@/components/global/globalButton";
import OrdersList from "@/components/table/orders/ordersList";
import { ManualOrderModal } from "@/components/table/orders/ManualOrderModal";
import { useConnectEasyParcel, useEasyParcelStatus } from "@/hooks/useOrder";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default function Page(props: pageProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [sheamId, setsheamId] = useState<string>("");
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const { data: easyParcelStatus, isPending: checkingEasyParcel } = useEasyParcelStatus();
  const { data: session } = useSession();
  const { mutate: connectEasyParcel, isPending: connectingEasyParcel } = useConnectEasyParcel();
  const connection = easyParcelStatus as any;
  const canConnectEasyParcel = ["admin", "sysadmin", "boss"].includes(session?.user?.role || "");

  const handleConnectEasyParcel = () => {
    connectEasyParcel(undefined, {
      onSuccess: (response: any) => {
        if (!response?.authorizationUrl) {
          toast.error("EasyParcel did not return an authorization URL");
          return;
        }
        window.location.assign(response.authorizationUrl);
      },
      onError: (error: any) => toast.error(error.response?.data?.message || "Failed to start EasyParcel connection"),
    });
  };

  return (
    <>
      <PageContainer scrollable={true} scrollContainerRef={setScrollParent}>
        <div className="flex flex-1 flex-col space-y-4 bg-background/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex items-start justify-between">
            <Heading
              title="Orders 📦"
              description="Data Listing And Actions "
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {checkingEasyParcel ? (
                <Button variant="outline" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking EasyParcel</Button>
              ) : connection?.connected ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600" disabled>
                    <CheckCircle2 className="mr-2 h-4 w-4" />EasyParcel {connection?.environment === "sandbox" ? "Sandbox " : ""}Connected
                  </Button>
                  {canConnectEasyParcel && <Button variant="ghost" size="sm" onClick={handleConnectEasyParcel} disabled={connectingEasyParcel}>Reconnect</Button>}
                </div>
              ) : (
                <Button variant="outline" onClick={handleConnectEasyParcel} disabled={!canConnectEasyParcel || !connection?.configured || connectingEasyParcel} title={!canConnectEasyParcel ? "Ask an administrator to connect EasyParcel" : connection?.configured ? "Connect an EasyParcel account" : "Backend EasyParcel configuration is incomplete"}>
                  {connectingEasyParcel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cable className="mr-2 h-4 w-4" />}
                  {!canConnectEasyParcel ? "EasyParcel Not Connected" : connection?.needsReconnect ? "Reconnect EasyParcel" : "Connect EasyParcel"}
                </Button>
              )}
              <div className="relative flex justify-end">
                 <Button onClick={() => setManualOrderOpen(true)}>
                   <Plus className="w-4 h-4 mr-2" /> Add External Order
                 </Button>
              </div>
            </div>
          </div>
          <Separator />
          <OrdersList scrollParent={scrollParent} />
        </div>
      </PageContainer>
      <ManualOrderModal open={manualOrderOpen} onOpenChange={setManualOrderOpen} />
    </>
  );
}
