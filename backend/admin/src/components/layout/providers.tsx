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
  useSession,
} from "next-auth/react";
import ReactQueryProvider from "../providers/react-query";
import { HeroUIProvider } from "@heroui/react";
import LiveSessionMonitor from "./liveSessionMonitor";
import SocketProvider from "../providers/socketProvider";
export default function Providers({
  session,
  children,
}: {
  session: SessionProviderProps["session"];
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SessionProvider session={session} refetchOnWindowFocus={false}>
          <BackgroundProvider>
            <ReactQueryProvider>
              <HeroUIProvider>
                <LiveSessionMonitor>
                  <SocketProvider>{children}</SocketProvider>
                </LiveSessionMonitor>
              </HeroUIProvider>
            </ReactQueryProvider>
          </BackgroundProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}
