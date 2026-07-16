/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { refreshAuth } from "@/api/auth";
import { registerSessionRefresh, refreshSessionToken } from "@/utils/axios";

let _isSigningOut = false;
export const markSigningOut = () => { _isSigningOut = true; };

const LiveSessionMonitor = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();

  // Register a session-refresh handler so the axios 401 interceptor can
  // persist freshly-issued tokens back into the NextAuth session.
  useEffect(() => {
    registerSessionRefresh(async () => {
      const refreshToken = (session?.user as any)?.refreshToken;
      if (!refreshToken) return null;
      try {
        const res = await refreshAuth(refreshToken);
        if (res?.success && res?.accessToken) {
          await update({
            token: res.accessToken,
            refreshToken: res.refreshToken || refreshToken,
          } as any);
          return res.accessToken;
        }
      } catch {
        /* ignore */
      }
      return null;
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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.token) {
      // Background sync for profile changes made by sysadmins
      import("@/api/users").then(m => {
        m.getUsers((session.user as any).token).then(res => {
          if (res?.data && Array.isArray(res.data)) {
            const currentUser = res.data.find((u: any) => u._id === (session.user as any).id);
            if (currentUser && currentUser.avatar !== (session.user as any).avatar) {
              update({ ...session, avatar: currentUser.avatar } as any);
            }
          }
        }).catch(err => console.error("Failed to sync session:", err));
      });
    }
  }, [status, (session?.user as any)?.id]);

  return <>{children}</>;
};

export default LiveSessionMonitor;
