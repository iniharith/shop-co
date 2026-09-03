"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Check, ClipboardList, LoaderCircle, LockKeyhole, PackageCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/loginForm";
import AxiosInstance from "@/utils/axios";

type TaskDetails = {
  _id: string;
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
const TASK_STATUSES = ["PLACED", "IN_PROGRESS", "PENDING_ARTWORK", "ARTWORK_REVIEWED", "ARTWORK_REJECTED", "IN_DESIGN", "PEMBETULAN", "DONE_DESIGN", "IN_PRODUCTION", "PRINT_AWB", "DONE_PRINTING", "PACKAGING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED", "RETURN"];

export default function TaskAccessPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [activeFileTag, setActiveFileTag] = useState<"for_print" | "draft" | "awb">("for_print");
  const taskFiles = task?.files || [];
  const visibleFiles = useMemo(() => {
    const matching = taskFiles.filter((file) => file.tag === activeFileTag);
    return matching.length > 0 ? matching : taskFiles;
  }, [activeFileTag, taskFiles]);

  useEffect(() => {
    if (!token || sessionStatus !== "authenticated" || !session?.user?.token) return;
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
  }, [token, sessionStatus, session?.user?.token]);

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && state === "loading")) {
    return <div className="flex min-h-[60vh] items-center justify-center font-[var(--font-dm-sans)]"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (sessionStatus !== "authenticated") {
    return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8 font-[var(--font-dm-sans)]"><Card className="w-full space-y-5 p-6 sm:p-8"><div className="text-center"><LockKeyhole className="mx-auto mb-3 h-10 w-10 text-primary" /><h1 className="text-2xl font-bold">Staff sign in required</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to open this internal production task.</p></div><LoginForm redirectTo={`/task-access/${encodeURIComponent(token)}`} /></Card></main>;
  }

  if (state === "error" || !task) {
    return <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12 font-[var(--font-dm-sans)]"><Card className="w-full p-6 text-center"><h1 className="text-xl font-bold">Task unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This QR code is invalid, expired, or your account does not have access.</p></Card></main>;
  }

  const items = task.lineItems?.length ? task.lineItems : [{ productName: task.productName || task.title, category: task.category, qty: 1 }];
  const fileUrl = (url: string) => url.startsWith("http") ? url : `${(process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`;
  const isImageFile = (name: string) => /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(name);
  const updateStatus = async (status: string) => {
    if (!session?.user?.token || status === task.status) return;
    const previousStatus = task.status;
    setTask({ ...task, status });
    setState("loading");
    try {
      await AxiosInstance(session.user.token).put(`/api/tasks/${task._id}`, { status });
    } catch {
      setTask({ ...task, status: previousStatus });
      setState("error");
      return;
    }
    setState("idle");
  };
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-[var(--font-dm-sans)] sm:py-12">
      <Card className="overflow-hidden">
        <div className="border-b bg-primary/5 p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><ClipboardList className="h-4 w-4" /> Task Details</div><h1 style={{ fontFamily: "var(--font-dm-sans)" }} className="text-2xl font-bold sm:text-3xl">{task.title}</h1>{task.orderId && <p className="mt-2 text-sm text-muted-foreground">Order: {task.orderId}</p>}</div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p><p className="mt-1 break-all font-semibold">{task.orderId || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p><p className="mt-1 break-all font-semibold">{task.username || "-"}</p></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p><p className="mt-1 font-semibold">{task.category?.replace(/_/g, " ") || "-"}</p></div>
           <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Current Status</p><div className="mt-2 flex items-center gap-2"><select value={task.status} onChange={(event) => void updateStatus(event.target.value)} className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm font-semibold"><option value={task.status}>{labelStatus(task.status)}</option>{TASK_STATUSES.filter((status) => status !== task.status).map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}</select><Check className="h-4 w-4 shrink-0 text-primary" /></div></div>
          <div className="rounded-lg border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p><p className="mt-1 font-semibold">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</p></div>
          {task.dueDate && <div className="flex items-center gap-3 rounded-lg border p-4 sm:col-span-2"><CalendarDays className="h-5 w-5 text-primary" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Expected Date</p><p className="font-semibold">{new Date(task.dueDate).toLocaleDateString()}</p></div></div>}
        </div>
        <div className="border-t p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 font-semibold"><PackageCheck className="h-5 w-5 text-primary" /> Products</div><div className="space-y-2">{items.map((item, index) => <div key={`${item.productName}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm"><div><p>{item.productName || "Product"}</p>{item.category && <p className="mt-0.5 text-xs text-muted-foreground">{item.category.replace(/_/g, " ")}</p>}</div><span className="shrink-0 font-semibold">Qty: {item.qty || 1}</span></div>)}</div></div>
        {taskFiles.length > 0 && <div className="border-t p-6 sm:p-8"><div className="mb-1 flex items-center gap-2 font-semibold"><ClipboardList className="h-5 w-5 text-primary" /> Artwork Files</div><p className="mb-4 text-xs text-muted-foreground">Click a preview to open the full-size file</p><div className="mb-5 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-1">{(["for_print", "draft", "awb"] as const).map((tag) => { const count = taskFiles.filter((file) => file.tag === tag).length; return <button key={tag} type="button" onClick={() => setActiveFileTag(tag)} className={`rounded-md px-2 py-2 text-[11px] font-bold uppercase transition-colors ${activeFileTag === tag ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tag === "for_print" ? "For Print" : tag === "awb" ? "AWB" : "Draft"} <span className="ml-1 opacity-70">({count})</span></button>; })}</div><div className="grid gap-4 md:grid-cols-2">{visibleFiles.map((file, index) => <a key={`${file.url}-${index}`} href={fileUrl(file.url)} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border-2 border-border bg-background transition-all hover:border-primary hover:shadow-md"><div className="flex h-64 items-center justify-center overflow-hidden bg-muted/30 p-3 sm:h-72">{isImageFile(file.name) ? <img src={fileUrl(file.url)} alt={file.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]" /> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><ClipboardList className="h-10 w-10" /><span className="text-xs">Open file preview</span></div>}</div><div className="flex items-center justify-between gap-3 border-t px-3 py-3"><span className="min-w-0 truncate text-sm font-semibold">{file.name}</span><span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{file.tag === "for_print" ? "For Print" : file.tag === "awb" ? "AWB" : "Draft"}</span></div></a>)}</div></div>}
      </Card>
    </main>
  );
}
