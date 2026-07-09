/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import type React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { IoCloseCircle } from "react-icons/io5";
import { Button } from "@heroui/button";
import { cn } from "@/lib/utils";
import { Bell, Package, Tag, CircleCheck, Truck, BellOff } from "lucide-react";

import { useMarkAllNotificationsAsRead } from "@/hooks/useNotification";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "ORDER":
      return <Package className="h-4 w-4" />;
    case "DELIVERY":
      return <Truck className="h-4 w-4" />;
    case "PROMOTION":
      return <Tag className="h-4 w-4" />;
    case "SYSTEM":
      return <Bell className="h-4 w-4" />;
    case "VERIFICATION":
      return <CircleCheck className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

interface NotificationsDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  notifications: any[];
}

const NotificationsDrawer = ({
  isOpen,
  setIsOpen,
  notifications,
}: NotificationsDrawerProps) => {
  const closeDrawer = () => setIsOpen(false);
  const { mutate, isPending } = useMarkAllNotificationsAsRead();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("new");

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "new") return !notification.read;
    if (activeTab === "read") return notification.read;
    return true; // "all" tab
  });

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <Drawer.Root
      shouldScaleBackground
      open={isOpen}
      onOpenChange={setIsOpen}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed z-50 inset-0 bg-black/10 backdrop-blur-sm" />
        <Drawer.Content
          className="right-1 top-2 bottom-2 fixed z-50 outline-none w-[350px] flex"
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-l border-white/10 text-white h-full w-full grow px-4 py-3 flex flex-col rounded-[16px] shadow-lg">
            <Drawer.Title className="font-medium px-0 border-b border-dashed border-white/10 justify-between flex items-center mb-4 pb-2">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <Button
                onPress={() => closeDrawer()}
                size="sm"
                isIconOnly
                variant="ghost"
                className="text-xl active:scale-100 border-0 px-0 text-primary bg-transparent"
              >
                <IoCloseCircle />
              </Button>
            </Drawer.Title>

            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full relative overflow-y-auto "
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="new" className="relative">
                  New
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="read">Read</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <div className="flex-1 h-full relative overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => {
                          if (notification.link) {
                            setIsOpen(false);
                            setTimeout(() => {
                              router.push(notification.link);
                            }, 100);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-lg border transition-all duration-200 hover:bg-white/5",
                          notification.link ? "cursor-pointer" : "",
                          notification.read
                            ? "border-white/5"
                            : "border-primary/30 bg-primary/5"
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center",
                              notification.read
                                ? "bg-white/5 text-gray-400"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3
                                className={cn(
                                  "text-sm font-medium",
                                  !notification.read && "text-primary"
                                )}
                              >
                                {notification.title}
                              </h3>
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  notification.createdAt as string
                                ).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <div className="flex flex-col h-full w-full items-center justify-center gap-2">
                        <BellOff className="w-16 h-16 text-gray-600" />
                        <p className="text-sm text-gray-400">
                          {activeTab === "new"
                            ? "No new notifications"
                            : activeTab === "read"
                            ? "No read notifications"
                            : "No notifications"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tabs>

            {filteredNotifications.length > 0 && (
              <div className="mt-4 pt-2 border-t border-white/10">
                <Button
                  className="w-full justify-center rounded-md bg-primary text-white hover:bg-primary/90"
                  size="sm"
                  isLoading={isPending}
                  onPress={() => {
                    mutate({});
                    // After marking all as read, if we're on the "new" tab, we might want to switch tabs
                    if (activeTab === "new") {
                      setActiveTab("all");
                    }
                  }}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default NotificationsDrawer;
