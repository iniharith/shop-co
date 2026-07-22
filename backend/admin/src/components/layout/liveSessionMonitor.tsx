/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { registerSessionRefresh, refreshSessionToken } from "@/utils/axios";

let _isSigningOut = false;
export const markSigningOut = () => { _isSigningOut = true; };

const LiveSessionMonitor = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();

  // Register a session-refresh handler so the axios 401 interceptor can
  // persist freshly-issued tokens back into the NextAuth session.
  useEffect(() => {
    registerSessionRefresh(async ({ accessToken, refreshToken }) => {
      await update({
        token: accessToken,
        refreshToken: refreshToken || (session?.user as any)?.refreshToken,
      } as any);
    });
    return () => registerSessionRefresh(null);
  }, [session, update]);

  useEffect(() => {
    if (status === "loading") return;
    if (_isSigningOut) return;

    if (status === "unauthenticated" && !pathname.startsWith("/auth") && !pathname.startsWith("/share") && !pathname.startsWith("/upload")) {
      // Give the token-refresh one chance before signing out.
      refreshSessionToken().then((recovered) => {
        if (recovered) return;
        _isSigningOut = true;
        document.cookie = 'fallback_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        signOut({ callbackUrl: '/auth/login' }).then(() => {
          toast.error("Session expired, please login again");
        });
      });
    }
  }, [status, pathname]);

  return <>{children}</>;
};

export default LiveSessionMonitor;
