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

const Provider = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionProviderProps["session"];
}) => {
  return (
      <SessionProvider session={session}>
        <ReactQueryProvider>
            <NextTopLoader
              height={2}
              shadow="0 0 10px hsl(45 93% 47%)"
              color="hsl(45 93% 47%)"
              showSpinner={false}
              zIndex={999999999999999}
            />
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <HeroUIProvider>
                <Toaster
                  visibleToasts={1}
                  position="bottom-center"
                  richColors
                />
                <LiveSessionMonitor>{children}</LiveSessionMonitor>
              </HeroUIProvider>
            </ThemeProvider>
        </ReactQueryProvider>
      </SessionProvider>
  );
};

export default Provider;
