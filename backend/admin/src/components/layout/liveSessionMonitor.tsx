/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

const LiveSessionMonitor = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated" && !pathname.startsWith("/auth") && !pathname.startsWith("/share") && !pathname.startsWith("/upload")) {
      // Clear fallback token to break infinite redirect loops
      document.cookie = 'fallback_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      signOut({ callbackUrl: '/auth/login' }).then(() => {
        toast.error("Session expired, please login again");
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
              update({ ...session, avatar: currentUser.avatar });
            }
          }
        }).catch(err => console.error("Failed to sync session:", err));
      });
    }
  }, [status, (session?.user as any)?.id]);

  return <>{children}</>;
};

export default LiveSessionMonitor;
