/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import ThemeProvider from "./ThemeToggle/theme-provider";
import BackgroundProvider from "./BackgroundProvider";
import {
  SessionProvider,
  SessionProviderProps,
} from "next-auth/react";
import ReactQueryProvider from "../providers/react-query";
import { HeroUIProvider } from "@heroui/react";
import LiveSessionMonitor from "./liveSessionMonitor";
import SocketProvider from "../providers/socketProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/messages";

export default function Providers({
  session,
  initialLocale,
  children,
}: {
  session: SessionProviderProps["session"];
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SessionProvider session={session} refetchOnWindowFocus={false}>
          <BackgroundProvider>
            <ReactQueryProvider>
              <HeroUIProvider>
                <LanguageProvider initialLocale={initialLocale}>
                  <LiveSessionMonitor>
                    <SocketProvider>{children}</SocketProvider>
                  </LiveSessionMonitor>
                </LanguageProvider>
              </HeroUIProvider>
            </ReactQueryProvider>
          </BackgroundProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}
