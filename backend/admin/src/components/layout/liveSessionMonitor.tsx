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
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated" && !pathname.startsWith("/auth") && !pathname.startsWith("/share")) {
      // Clear fallback token to break infinite redirect loops
      document.cookie = 'fallback_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      signOut({ callbackUrl: '/auth/login' }).then(() => {
        toast.error("Session expired, please login again");
      });
    }
  }, [status, pathname]);
  return <>{children}</>;
};



export default LiveSessionMonitor;
