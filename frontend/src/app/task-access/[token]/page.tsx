"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, ClipboardList, LoaderCircle, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import AxiosInstance from "@/utils/axios";

type TaskDetails = {
  title: string;
  orderId?: string | null;
  username?: string | null;
  productName?: string | null;
  category?: string | null;
  lineItems?: { productName?: string; category?: string; qty?: number }[];
  files?: { name: string; url: string; tag: "draft" | "for_print" | "awb" }[];
  status: string;
  dueDate?: string | null;
  createdAt?: string;
};

const labelStatus = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export default function TaskAccessPage() {
  const { token } = useParams<{ token: string }>();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setState("loading");
    void AxiosInstance().get(`/api/tasks/qr/${encodeURIComponent(token)}`)
      .then(({ data }) => {
        if (!cancelled) {
          setTask(data?.task || null);
          setState(data?.task ? "idle" : "error");
        }
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [token]);

  if (state === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center font-[var(--font-dm-sans)]"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (state === "error" || !task) {
    return <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12 font-[var(--font-dm-sans)]"><Card className="w-full p-6 text-center"><h1 className="text-xl font-bold">Task unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This QR code is invalid, expired, or your account does not have access.</p></Card></main>;
  }

  const items = task.lineItems?.length ? task.lineItems : [{ productName: task.productName || task.title, category: task.category, qty: 1 }];
  const taskFiles = task.files || [];
  const fileUrl = (url: string) => url.startsWith("http") ? url : `${(process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-[var(--font-dm-sans)] sm:py-12">
      <Card className="overflow-hidden">
        <div className="border-b bg-primary/5 p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><ClipboardList className="h-4 w-4" /> Task Details</div><h1 style={{ fontFamily: "var(--font-dm-sans)" }} className="text-2xl font-bold sm:text-3xl">{task.title}</h1>{task.orderId && <p className="mt-2 text-sm text-muted-foreground">Order: {task.orderId}</p>}</div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p><p className="mt-1 break-all font-semibold">{task.orderId || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p><p className="mt-1 break-all font-semibold">{task.username || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p><p className="mt-1 font-semibold">{task.category?.replace(/_/g, " ") || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Current Status</p><p className="mt-1 font-semibold">{labelStatus(task.status)}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p><p className="mt-1 font-semibold">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</p></div>
          {task.dueDate && <div className="flex items-center gap-3 rounded-lg border p-4 sm:col-span-2"><CalendarDays className="h-5 w-5 text-primary" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Expected Date</p><p className="font-semibold">{new Date(task.dueDate).toLocaleDateString()}</p></div></div>}
        </div>
        <div className="border-t p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 font-semibold"><PackageCheck className="h-5 w-5 text-primary" /> Products</div><div className="space-y-2">{items.map((item, index) => <div key={`${item.productName}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm"><div><p>{item.productName || "Product"}</p>{item.category && <p className="mt-0.5 text-xs text-muted-foreground">{item.category.replace(/_/g, " ")}</p>}</div><span className="shrink-0 font-semibold">Qty: {item.qty || 1}</span></div>)}</div></div>
        {taskFiles.length > 0 && <div className="border-t p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 font-semibold"><ClipboardList className="h-5 w-5 text-primary" /> Artwork Files</div><p className="mb-3 text-xs text-muted-foreground">Click to open image</p><div className="space-y-2">{taskFiles.map((file, index) => <a key={`${file.url}-${index}`} href={fileUrl(file.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-primary/5"><span className="min-w-0 truncate">{file.name}</span><span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{file.tag === "for_print" ? "For Print" : file.tag === "awb" ? "AWB" : "Draft"}</span></a>)}</div></div>}
      </Card>
    </main>
  );
}
