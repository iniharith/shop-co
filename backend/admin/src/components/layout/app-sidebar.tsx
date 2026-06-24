"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Printer,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Icons } from "../global/icons";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotification";
import { useConversations } from "@/hooks/useChat";

import { roleByNavItems } from "@/constants/navItems";
import { DialogTitle } from "../ui/dialog";
export const company = {
  name: "Kampung Cetak",
  logo: "/logo.png",
  plan: "Enterprise",
};

export default function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile, openMobile } = useSidebar();
  const { theme } = useTheme();
  const { data: notificationsResponse } = useNotifications();
  const unreadCount = notificationsResponse?.notifications?.filter((n: any) => !n.read).length || 0;
  
  const { data: conversationsResponse } = useConversations();
  const unreadChatCount = (conversationsResponse as any)?.conversations?.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0) || 0;
 
  const navItems = roleByNavItems(session?.user?.role)

  return (
    <Sidebar collapsible="icon" variant="floating" className="shadow-lg border-0 rounded-xl">
      
      <SidebarHeader>
       
        <div className="flex gap-3 py-2 text-sidebar-accent-foreground items-center">
          <div className={`flex aspect-square items-center justify-center bg-white overflow-hidden shadow-sm border border-slate-100 transition-all ${state === "collapsed" ? "size-8 rounded-lg" : "size-12 rounded-2xl"}`}>
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
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item: any) => {
              const Icon = item.icon
                ? Icons[item.icon as keyof typeof Icons]
                : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                        className="text-base font-bold py-6"
                      >
                        <div className="inherit flex items-center gap-2">
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
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
                                console.log("clicked");
                                setOpenMobile(false);
                              }}
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link
                                onClick={() => {
                                  console.log("clicked");
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
                      console.log("clicked");
                      setOpenMobile(false);
                    }}
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className="text-base font-bold py-6"
                  >
                    <Link href={item.url} className="flex items-center gap-2">
                      <Icon />
                      <span>{item.title}</span>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-slate-800 bg-slate-900 hover:bg-slate-800 data-[state=open]:text-slate-100 relative"
                >
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center rounded-full z-10 shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                  <Avatar className="h-8 w-8 rounded-lg relative">
                    <AvatarImage src={((session?.user as any)?.avatar || (session?.user as any)?.image)?.startsWith('http') ? ((session?.user as any)?.avatar || (session?.user as any)?.image) : ((session?.user as any)?.avatar || (session?.user as any)?.image) ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${((session?.user as any)?.avatar || (session?.user as any)?.image).replace(/^\//, '')}` : ""} />
                    <AvatarFallback className="rounded-lg text-white">
                      {session?.user?.name?.slice(0, 2)?.toUpperCase() || "CN"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-white text-left text-sm leading-tight">
                    <span className="truncate text-white font-semibold">
                      {session?.user?.name || ""}
                    </span>
                    <span className="truncate text-white text-xs">
                      {session?.user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0  font-normal">
                  <div className="flex items-center  gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={((session?.user as any)?.avatar || (session?.user as any)?.image)?.startsWith('http') ? ((session?.user as any)?.avatar || (session?.user as any)?.image) : ((session?.user as any)?.avatar || (session?.user as any)?.image) ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${((session?.user as any)?.avatar || (session?.user as any)?.image).replace(/^\//, '')}` : ""} />
                      <AvatarFallback className="rounded-lg text-white">
                        {session?.user?.name?.slice(0, 2)?.toUpperCase() ||
                          "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1  text-left text-sm leading-tight">
                      <span  className="truncate  font-semibold">
                        {session?.user?.name || ""}
                      </span>
                      <span  className="truncate  text-xs">
                        {" "}
                        {session?.user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  {/* <DropdownMenuItem disabled>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <CreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Bell />
                    Notifications
                  </DropdownMenuItem> */}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                className="hover:bg-sidebar-accent/50 cursor-pointer"
                  onClick={() => {
                    signOut({
                      callbackUrl:
                        `${window.location.origin}/auth/login` as string,
                    });
                    setOpenMobile(false);
                  }}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
