"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, ClipboardList, LoaderCircle, LockKeyhole, PackageCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/loginForm";
import AxiosInstance from "@/utils/axios";

type TaskDetails = {
  title: string;
  orderId?: string | null;
  username?: string | null;
  productName?: string | null;
  category?: string | null;
  lineItems?: { productName?: string; category?: string; qty?: number }[];
  status: string;
  dueDate?: string | null;
  createdAt?: string;
};

const labelStatus = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export default function TaskAccessPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.token || !token) return;
    let cancelled = false;
    setState("loading");
    void AxiosInstance(session.user.token).get(`/api/tasks/qr/${encodeURIComponent(token)}`)
      .then(({ data }) => {
        if (!cancelled) {
          setTask(data?.task || null);
          setState(data?.task ? "idle" : "error");
        }
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [sessionStatus, session?.user?.token, token]);

  if (sessionStatus === "loading" || state === "loading") {
    return <div className="flex min-h-[60vh] items-center justify-center font-[var(--font-dm-sans)]"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (sessionStatus !== "authenticated") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12 font-[var(--font-dm-sans)]">
        <Card className="w-full space-y-5 p-6 text-center sm:p-8">
          <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
          <div><h1 className="text-2xl font-bold">Sign in to view this task</h1><p className="mt-2 text-sm text-muted-foreground">This QR code is linked to a customer account. Sign in and we will open the task automatically.</p></div>
          <LoginForm redirectTo={`/task-access/${encodeURIComponent(token)}`} />
        </Card>
      </main>
    );
  }

  if (state === "error" || !task) {
    return <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12 font-[var(--font-dm-sans)]"><Card className="w-full p-6 text-center"><h1 className="text-xl font-bold">Task unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This QR code is invalid, expired, or your account does not have access.</p></Card></main>;
  }

  const items = task.lineItems?.length ? task.lineItems : [{ productName: task.productName || task.title, category: task.category, qty: 1 }];
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-[var(--font-dm-sans)] sm:py-12">
      <Card className="overflow-hidden">
        <div className="border-b bg-primary/5 p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><ClipboardList className="h-4 w-4" /> Task Details</div><h1 className="text-2xl font-bold sm:text-3xl">{task.title}</h1>{task.orderId && <p className="mt-2 text-sm text-muted-foreground">Order: {task.orderId}</p>}</div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p><p className="mt-1 break-all font-semibold">{task.orderId || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p><p className="mt-1 break-all font-semibold">{task.username || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p><p className="mt-1 font-semibold">{task.category?.replace(/_/g, " ") || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Current Status</p><p className="mt-1 font-semibold">{labelStatus(task.status)}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p><p className="mt-1 font-semibold">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</p></div>
          {task.dueDate && <div className="flex items-center gap-3 rounded-lg border p-4 sm:col-span-2"><CalendarDays className="h-5 w-5 text-primary" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Expected Date</p><p className="font-semibold">{new Date(task.dueDate).toLocaleDateString()}</p></div></div>}
        </div>
        <div className="border-t p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 font-semibold"><PackageCheck className="h-5 w-5 text-primary" /> Products</div><div className="space-y-2">{items.map((item, index) => <div key={`${item.productName}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm"><div><p>{item.productName || "Product"}</p>{item.category && <p className="mt-0.5 text-xs text-muted-foreground">{item.category.replace(/_/g, " ")}</p>}</div><span className="shrink-0 font-semibold">Qty: {item.qty || 1}</span></div>)}</div></div>
      </Card>
    </main>
  );
}
