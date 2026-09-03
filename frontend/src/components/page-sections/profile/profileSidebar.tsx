/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { profileLinks } from "@/constants/data";
import { User, LayoutDashboard, ShoppingBag, Upload, CheckSquare, MessageCircle, Headset, Heart, LogOut } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  "Profile": <User size={20} />,
  "Dashboard": <LayoutDashboard size={20} />,
  "Orders": <ShoppingBag size={20} />,
  "Tasks": <CheckSquare size={20} />,
  "Upload Artwork": <Upload size={20} />,
  "Wishlist": <Heart size={20} />,
  "Chat": <MessageCircle size={20} />,
  "Support": <Headset size={20} />
};

const ProfileSidebar = () => {
  const pathname = usePathname();
  return (
    <>
      <div className="sticky top-24 hidden overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:block">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-[#d6a21d]">Member menu</p>
          <p className="mt-1 text-sm text-muted-foreground">Account navigation / Navigasi akaun</p>
        </div>
        <div className="flex flex-col gap-1 p-3">
          {profileLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/home/profile" && pathname.startsWith(`${link.href}/`));
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors",
                  isActive ? "bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                    <div className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-amber-950" />
                )}
                <div className="shrink-0 flex items-center justify-center">
                  {iconMap[link.name] || <User size={20} />}
                </div>
                <span className="font-semibold">{link.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-border p-3">
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300">
            <LogOut size={20} />
            <span>Logout / Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scroll Tabs */}
      <div className="no-scrollbar mb-4 w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-xl md:hidden">
        <div className="flex w-max min-w-full">
          {profileLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors",
                  isActive ? "text-amber-700 dark:text-[#f2c14e]" : "text-muted-foreground"
                )}
              >
                {iconMap[link.name] || <User size={16} />}
                <span className="font-medium text-sm">{link.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full bg-amber-600" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;
