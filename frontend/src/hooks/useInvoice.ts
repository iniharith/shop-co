"use client";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

export function useDownloadInvoice() {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`${API}/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INV-${orderId.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success("Invoice downloaded!");
    },
    onError: () => {
      toast.error("Failed to download invoice");
    },
  });
}
