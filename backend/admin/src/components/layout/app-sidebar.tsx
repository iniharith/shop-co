/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Icons } from "../global/icons";
import { useConversations } from "@/hooks/useChat";

import { roleByNavItems } from "@/constants/navItems";
import { useLanguage } from "@/i18n/LanguageProvider";
export const company = {
  name: "Kampung Cetak",
  logo: "/logo.png",
  plan: "Enterprise",
};

const navTitleKey: Record<string, string> = {
  Dashboard: "nav.dashboard",
  Projects: "nav.projects",
  Users: "nav.users",
  Orders: "nav.orders",
  Catalog: "Store catalog",
  "Catalog Analytics": "Catalog analytics",
  Artworks: "nav.artworks",
  "Print Drafts": "nav.printDrafts",
  Tracking: "nav.tracking",
  Tasks: "nav.tasks",
  Schedule: "nav.schedule",
  Chat: "nav.chat",
  Production: "nav.production",
  Sublimation: "nav.sublimation",
  Packaging: "nav.packaging",
  History: "nav.history",
  Monitoring: "nav.monitoring",
  Tools: "nav.tools",
};

export default function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { state, setOpenMobile } = useSidebar();
  const { data: conversationsResponse } = useConversations();
  const { t } = useLanguage();
  const unreadChatCount = (conversationsResponse as any)?.conversations?.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0) || 0;
 
  const navItems = roleByNavItems(session?.user?.role)

  return (
    <Sidebar collapsible="icon" variant="floating" className="shadow-lg border-0 rounded-xl">
      
      <SidebarHeader>
       
        <div className="flex gap-3 py-2 text-sidebar-accent-foreground items-center">
          <div className={`flex aspect-square items-center justify-center overflow-hidden transition-all ${state === "collapsed" ? "size-8 rounded-lg" : "size-12 rounded-2xl"}`}>
            <Image src={company.logo} width={48} height={48} alt="Kampung Cetak" className="object-contain w-full h-full" />
          </div>
          {state !== "collapsed" && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{company.name}</span>
              <span className="truncate text-xs">{company.plan}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.overview")}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item: any) => {
              const Icon = item.icon
                ? Icons[item.icon as keyof typeof Icons]
                : Icons.logo;
              const hasActiveChild = item.items?.some((subItem: any) => pathname === subItem.url);
              const isItemActive = pathname === item.url || hasActiveChild;
              const displayTitle = t((navTitleKey[item.title] || item.title) as any);
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive || isItemActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={displayTitle}
                        isActive={isItemActive}
                        className="text-base font-bold py-6"
                      >
                        <div className="inherit flex items-center gap-2">
                          {item.icon && <Icon className="size-4 shrink-0" />}
                          <span>{displayTitle}</span>
                        </div>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem: any) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              onClick={() => {
                                setOpenMobile(false);
                              }}
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link
                                onClick={() => {
                                  setOpenMobile(false);
                                }}
                                href={subItem.url}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                    asChild
                    tooltip={displayTitle}
                    isActive={pathname === item.url}
                    className="text-base font-bold py-6"
                  >
                    <Link href={item.url} className="flex items-center gap-2">
                      <Icon />
                      <span>{displayTitle}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === 'Chat' && unreadChatCount > 0 && (
                    <SidebarMenuBadge className="bg-red-500 text-white rounded-full px-1.5 min-w-5 flex items-center justify-center text-[10px]">
                      {unreadChatCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
