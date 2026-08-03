"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] items-center justify-center p-5">
      <div className="w-full max-w-lg rounded-3xl border border-destructive/20 bg-card/90 p-7 text-center shadow-xl backdrop-blur sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">This page could not be loaded</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your work is still safe. Retry the page or return to the dashboard.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}><RotateCcw className="mr-2 size-4" />Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="mr-2 size-4" />Reload</Button>
          <Button variant="ghost" asChild><Link href="/admin/dashboard"><Home className="mr-2 size-4" />Dashboard</Link></Button>
        </div>
      </div>
    </div>
  );
}
