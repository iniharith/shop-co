/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useEffect } from "react";
import { mailStore } from "@/lib/mailStore";
import { useMailShortcuts } from "@/components/mail/useMailShortcuts";
import { MailApp } from "@/components/mail/MailApp";
import { Toaster } from "sonner";

export default function EmailPage() {
  useMailShortcuts();

  /* Auto-refresh to stay in sync with the mail server */
  useEffect(() => {
    const id = setInterval(() => {
      mailStore.getState().refresh();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <MailApp />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
