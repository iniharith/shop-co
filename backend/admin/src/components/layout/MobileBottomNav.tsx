"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Image as ImageIcon, Hammer, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { motion } from "framer-motion";

const bottomNavItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    url: "/admin/tasks",
    icon: CheckSquare,
  },
  {
    title: "Artworks",
    url: "/admin/artworks",
    icon: ImageIcon,
  },
  {
    title: "Production",
    url: "/admin/production",
    icon: Hammer,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="flex items-center justify-around bg-background border shadow-xl rounded-full p-2 ring-1 ring-border/50">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
          const Icon = item.icon;
          
          return (
            <Link key={item.url} href={item.url} className="relative p-2 flex flex-col items-center justify-center min-w-[3.5rem]">
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-primary/10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-5 h-5 relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-[0.6rem] font-medium mt-1 relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.title}
              </span>
            </Link>
          );
        })}
        
        {/* Menu Button to trigger Sidebar Sheet */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setOpenMobile(true);
          }}
          className="relative p-2 flex flex-col items-center justify-center min-w-[3.5rem]"
        >
          <Menu className="w-5 h-5 text-muted-foreground relative z-10" strokeWidth={2} />
          <span className="text-[0.6rem] font-medium mt-1 text-muted-foreground relative z-10">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
}
