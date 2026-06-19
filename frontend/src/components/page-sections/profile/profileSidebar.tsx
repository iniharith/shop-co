"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { profileLinks } from "@/constants/data";
import { User, LayoutDashboard, ShoppingBag, Upload, CheckSquare } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  "Profile": <User size={20} />,
  "Dashboard": <LayoutDashboard size={20} />,
  "Orders": <ShoppingBag size={20} />,
  "Tasks": <CheckSquare size={20} />,
  "Upload Artwork": <Upload size={20} />
};

const ProfileSidebar = () => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Desktop Hover Sidebar */}
      <div 
        className={cn(
          "bg-white border border-gray-200 rounded-3xl shadow-sm transition-all duration-300 ease-in-out z-20 flex-col overflow-hidden hidden md:flex sticky top-24",
          isHovered ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ height: 'min-content' }}
      >
        <div className="flex flex-col py-6 gap-2 w-full">
          {profileLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-3 transition-colors relative group",
                  isActive ? "text-primary bg-primary/5" : "text-gray-500 hover:text-black hover:bg-gray-50"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                )}
                <div className="shrink-0 flex items-center justify-center">
                  {iconMap[link.name] || <User size={20} />}
                </div>
                <span 
                  className={cn(
                    "font-medium whitespace-nowrap transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                >
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Horizontal Scroll Tabs */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar bg-white border border-gray-200 rounded-2xl mb-4 shadow-sm">
        <div className="flex w-max min-w-full">
          {profileLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 transition-colors relative whitespace-nowrap",
                  isActive ? "text-primary" : "text-gray-500"
                )}
              >
                {iconMap[link.name] || <User size={16} />}
                <span className="font-medium text-sm">{link.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-t-full" />
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
