"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 bg-[#09090b] font-sans text-white">
        <main className="flex min-h-screen items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-500/15 text-2xl text-red-300">!</div>
            <h1 className="mt-5 text-2xl font-bold">Kampung Cetak needs to recover</h1>
            <p className="mt-2 text-sm text-white/65">An unexpected application error occurred. Retry, reload, or return to the dashboard.</p>
            {error.digest && <p className="mt-3 font-mono text-xs text-white/45">Reference: {error.digest}</p>}
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <button onClick={reset} className="rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-black">Try again</button>
              <button onClick={() => window.location.reload()} className="rounded-xl border border-white/15 px-4 py-2.5 font-semibold">Reload</button>
              <a href="/admin/dashboard" className="rounded-xl px-4 py-2.5 font-semibold text-white/75">Dashboard</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
