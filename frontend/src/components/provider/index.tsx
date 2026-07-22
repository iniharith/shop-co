/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import ReactQueryProvider from "./react-query";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import LiveSessionMonitor from "./liveSessionMonitor";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/messages";

const Provider = ({
  children,
  session,
  initialLocale,
}: {
  children: React.ReactNode;
  session: SessionProviderProps["session"];
  initialLocale: Locale;
}) => {
  return (
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        <ReactQueryProvider>
            <NextTopLoader
              height={2}
              shadow="0 0 10px white"
              color="white"
              showSpinner={false}
              zIndex={999999999999999}
            />
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <LanguageProvider initialLocale={initialLocale}>
                <HeroUIProvider>
                  <Toaster
                    visibleToasts={1}
                    position="bottom-center"
                    richColors
                  />
                  <LiveSessionMonitor>{children}</LiveSessionMonitor>
                </HeroUIProvider>
              </LanguageProvider>
            </ThemeProvider>
        </ReactQueryProvider>
      </SessionProvider>
  );
};

export default Provider;
