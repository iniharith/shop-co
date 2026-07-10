/**
 * Coded by Harith
 * Kampungcetak ®
 */

"use client";
import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../global/breadCrumb';
import SearchInput from '../global/searchInput';
import SyncButton from '../global/sync-button';
import { UserNav } from './user-nav';
import ThemeToggle from './ThemeToggle/theme-toggle';
import { useNotifications } from '@/hooks/useNotification';
import { useEffect } from 'react';
import NotificationsPanel from '../global/notifications-drawer';
import UploadMonitor from '../global/upload-monitor';

export default function Header() {
  const { data: notificationsResponse } = useNotifications();
  const notifications = notificationsResponse?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Show browser notification if there are new unread ones
  useEffect(() => {
    if (unreadCount > 0 && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const latestUnread = notifications.find(n => !n.read);
      if (latestUnread && !sessionStorage.getItem(`notified_${latestUnread._id}`)) {
        new Notification(latestUnread.title, { body: latestUnread.message });
        sessionStorage.setItem(`notified_${latestUnread._id}`, "true");
      }
    }
  }, [unreadCount, notifications]);

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex items-center gap-2'>
          <SyncButton />
          <SearchInput />
        </div>

        <UploadMonitor />

        <NotificationsPanel notifications={notifications} />

        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
