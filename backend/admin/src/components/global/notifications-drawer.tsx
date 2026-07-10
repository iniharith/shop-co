/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Redesigned to match the reference notification panel UX: a floating
 * popover anchored to the bell (not a full-height side drawer), pill-style
 * segmented tabs, and avatar-style rows with a colored category tag and an
 * unread presence dot. The bell trigger now lives inside this component
 * (see header.tsx) so the whole "bell + panel" unit is self-contained.
 */
"use client";
import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bell,
  Package,
  Tag,
  CircleCheck,
  Truck,
  BellOff,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMarkAllNotificationsAsRead } from "@/hooks/useNotification";

// ─── Per-type presentation ──────────────────────────────────────────────────
// Every notification type gets its own icon + tinted color, mirroring how
// the reference design gives each project its own colored tag. Adjust here
// if a new notification `type` is ever added to the backend model.
const TYPE_META: Record<
  string,
  { icon: typeof Package; label: string; classes: string }
> = {
  ORDER: {
    icon: Package,
    label: "Order",
    classes: "bg-blue-500/15 text-blue-500",
  },
  DELIVERY: {
    icon: Truck,
    label: "Delivery",
    classes: "bg-emerald-500/15 text-emerald-500",
  },
  PROMOTION: {
    icon: Tag,
    label: "Promotion",
    classes: "bg-violet-500/15 text-violet-500",
  },
  VERIFICATION: {
    icon: CircleCheck,
    label: "Verification",
    classes: "bg-teal-500/15 text-teal-500",
  },
  SYSTEM: {
    icon: Bell,
    label: "System",
    classes: "bg-amber-500/15 text-amber-500",
  },
};
const getTypeMeta = (type: string) => TYPE_META[type] ?? TYPE_META.SYSTEM;

// ─── Tabs ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "new", label: "New" },
  { key: "orders", label: "Orders" },
  { key: "tasks", label: "Tasks" },
  { key: "archive", label: "Archive" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const matchesTab = (notification: any, tab: TabKey) => {
  switch (tab) {
    case "new":
      return !notification.read;
    case "orders":
      return notification.type === "ORDER" || notification.type === "DELIVERY";
    case "tasks":
      return !!notification.taskId;
    case "archive":
      return !!notification.read;
  }
};

interface NotificationsPanelProps {
  notifications: any[];
}

const NotificationsPanel = ({ notifications }: NotificationsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const { mutate: markAllRead, isPending: isMarkingRead } =
    useMarkAllNotificationsAsRead();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => matchesTab(n, activeTab));

  const handleSelect = (notification: any) => {
    if (!notification.link) return;
    setIsOpen(false);
    setTimeout(() => router.push(notification.link), 100);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative mx-2 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-muted dark:text-gray-300"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[380px] rounded-2xl border border-white/10 bg-background/80 p-0 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-base font-semibold text-foreground">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={isMarkingRead}
              onClick={() => markAllRead({})}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Pill tabs */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.key === "new" && unreadCount > 0 && (
                  <span className="ml-1">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto px-2 pb-2">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filtered.map((notification) => {
                const meta = getTypeMeta(notification.type);
                const Icon = meta.icon;
                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleSelect(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors",
                      notification.link
                        ? "cursor-pointer hover:bg-muted"
                        : "cursor-default",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          meta.classes
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!notification.read && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-popover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>
                          {formatDistanceToNowStrict(
                            new Date(notification.createdAt as string),
                            { addSuffix: true }
                          )}
                        </span>
                        <span>•</span>
                        <span className={cn("font-medium", meta.classes.split(" ")[1])}>
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    {notification.link && (
                      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-14">
              <BellOff className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "new"
                  ? "No new notifications"
                  : activeTab === "orders"
                  ? "No order notifications"
                  : activeTab === "tasks"
                  ? "No task notifications"
                  : "Nothing archived yet"}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
