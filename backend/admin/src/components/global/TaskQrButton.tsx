"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, LoaderCircle, Printer, QrCode } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AxiosInstance from "@/utils/axios";

type TaskQrButtonProps = {
  taskId?: string;
  taskTitle?: string;
  compact?: boolean;
};

export function TaskQrButton({ taskId, taskTitle, compact = false }: TaskQrButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [taskUrl, setTaskUrl] = useState("");

  useEffect(() => {
    if (!open || !taskId || !session?.user?.token) return;
    let cancelled = false;
    setIsLoading(true);
    void AxiosInstance(session.user.token).get(`/api/tasks/${taskId}/qr`)
      .then(async ({ data }) => {
        const token = data?.token;
        if (!token) throw new Error("QR token was not returned");
        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
          || (process.env.NODE_ENV === "production" ? "https://kampungcetak.com" : window.location.origin);
        const url = `${baseUrl.replace(/\/$/, "")}/task-access/${token}`;
        const image = await QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "H" });
        if (!cancelled) {
          setTaskUrl(url);
          setQrDataUrl(image);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to generate task QR code");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, taskId, session?.user?.token]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(taskUrl);
      toast.success("Task QR link copied");
    } catch {
      toast.error("Failed to copy task QR link");
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${(taskTitle || "task").replace(/[^a-z0-9-_]+/gi, "-")}-qr.png`;
    link.click();
  };

  const printQr = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open("", "task-qr-print", "width=700,height=800");
    if (!printWindow) return;
    const title = printWindow.document.createElement("h1");
    title.textContent = taskTitle || "Task QR";
    const image = printWindow.document.createElement("img");
    image.src = qrDataUrl;
    image.alt = "Task QR code";
    printWindow.document.title = taskTitle || "Task QR";
    printWindow.document.head.insertAdjacentHTML("beforeend", "<style>body{font-family:Arial;text-align:center;padding:40px}img{width:420px;max-width:90vw}h1{font-size:22px}</style>");
    printWindow.document.body.append(title, image);
    image.onload = () => { printWindow.print(); printWindow.close(); };
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-7 w-7" : "gap-2"}
        disabled={!taskId}
        title={taskId ? "View Task QR" : "QR is available for task folders only"}
        onClick={(event) => { event.stopPropagation(); setOpen(true); }}
      >
        <QrCode className="h-4 w-4" />
        {!compact && "QR Code"}
        <span className="sr-only">View Task QR</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task QR Code</DialogTitle>
            <DialogDescription>{taskTitle || "Scan this code to open the task"}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-white p-4">
            {isLoading ? <LoaderCircle className="h-8 w-8 animate-spin text-slate-500" /> : qrDataUrl ? <img src={qrDataUrl} alt="Task QR code" className="h-64 w-64" /> : <p className="text-sm text-slate-500">QR code unavailable</p>}
          </div>
          <p className="break-all rounded-md bg-muted p-2 text-xs text-muted-foreground">{taskUrl}</p>
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={copyUrl} disabled={!taskUrl}><Copy className="mr-2 h-4 w-4" />Copy Link</Button>
            <Button type="button" variant="outline" onClick={downloadQr} disabled={!qrDataUrl}><Download className="mr-2 h-4 w-4" />Download</Button>
            <Button type="button" variant="outline" onClick={printQr} disabled={!qrDataUrl}><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button type="button" onClick={() => window.open(taskUrl, "_blank", "noopener,noreferrer")} disabled={!taskUrl}><ExternalLink className="mr-2 h-4 w-4" />Open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
