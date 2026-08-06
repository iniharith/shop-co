/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { LoaderCircle, CircleCheck, TriangleAlert } from "lucide-react";

function MagicLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("This login link is missing a token. Ask your administrator to regenerate it.");
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await signIn("credentials", { magicToken: token, redirect: false });
      if (cancelled) return;
      if (result?.error) {
        setStatus("error");
        setError("This login link is invalid or has expired. Ask your administrator for a new one.");
        return;
      }
      setStatus("done");
      router.push("/admin/dashboard");
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 items-center justify-center rounded-md">
              <Image src="/logo.png" width={120} height={40} alt="Kampung Cetak" className="object-contain" />
            </div>
            <h1 className="text-xl font-bold">
              Welcome to Kampung Cetak
            </h1>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
            {status === "loading" && (
              <>
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Signing you in...</p>
              </>
            )}
            {status === "done" && (
              <>
                <CircleCheck className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium">Logged in. Redirecting...</p>
              </>
            )}
            {status === "error" && (
              <>
                <TriangleAlert className="h-8 w-8 text-red-500" />
                <p className="text-sm font-medium">{error}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={null}>
      <MagicLoginContent />
    </Suspense>
  );
}
