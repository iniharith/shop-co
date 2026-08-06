/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Mail as MailIcon } from "lucide-react";
import { FaEnvelope, FaLock } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mailStore } from "@/lib/mailStore";
import { GLASS } from "./mail-utils";

export function LoginView() {
  const login = mailStore((s) => s.login);
  const enterPreview = mailStore((s) => s.enterPreview);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErr(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className={`w-full max-w-sm p-6 md:p-8 ${GLASS}`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a href="/" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex h-12 items-center justify-center rounded-md">
                  <Image
                    src="/images/kampung-cetak-logo.png"
                    width={120}
                    height={40}
                    alt="Kampung Cetak"
                    className="object-contain"
                  />
                </div>
                <span className="sr-only">Kampung Cetak</span>
              </a>
              <h1 className="text-xl font-bold">Welcome to Kampung Cetak</h1>
              <div className="text-center text-sm text-muted-foreground">
                Login to your <span className="font-medium text-foreground">@kampungcetak.com</span> mail
              </div>
            </div>

            <form onSubmit={submit} className="grid w-full gap-4 py-4 md:px-3">
              {err && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {err}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="mail-email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mail-email"
                    type="email"
                    placeholder="you@kampungcetak.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="mail-pass" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mail-pass"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-primary dark:border dark:border-primary/40 dark:bg-primary/40 dark:text-white dark:backdrop-blur-md"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <MailIcon />}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Your password is sent only to your own mail server to authenticate.
            </p>

            <div className="relative py-2 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-2xl"
              onClick={enterPreview}
            >
              <MailIcon />
              Preview UI with sample data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
