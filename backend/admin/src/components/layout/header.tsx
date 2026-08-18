/**
 * Coded by Harith
 * Kampungcetak ®
 */

"use client";
import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import SearchInput from '../global/searchInput';
import SyncButton from '../global/sync-button';
import { UserNav } from './user-nav';
import ThemeToggle from './ThemeToggle/theme-toggle';
import { LanguageSwitcher } from '../global/LanguageSwitcher';
import { useNotifications } from '@/hooks/useNotification';
import { useEffect } from 'react';
import NotificationsPanel from '../global/notifications-drawer';
import UploadMonitor from '../global/upload-monitor';

export default function Header() {
  const { data: notificationsResponse } = useNotifications();
  const notifications = notificationsResponse?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Show browser notification if there are new unread ones
  useEffect(() => {
    if (unreadCount > 0 && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const latestUnread = notifications.find(n => !n.read);
      try {
        if (latestUnread && !sessionStorage.getItem(`notified_${latestUnread._id}`)) {
          new Notification(latestUnread.title, { body: latestUnread.message });
          sessionStorage.setItem(`notified_${latestUnread._id}`, "true");
        }
      } catch {}
    }
  }, [unreadCount, notifications]);

  return (
      <header className='flex h-20 shrink-0 items-center px-3 sm:px-4'>
        <div className='flex min-w-0 flex-1 items-center gap-2 rounded-[28px] border border-white/50 bg-card p-2 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.55)] dark:border-white/10'>
          <div className='flex shrink-0 items-center gap-2 pl-1 sm:pl-2'>
            <SidebarTrigger className='hidden h-10 w-10 rounded-full bg-background/80 md:flex' />
          </div>

          <SearchInput
            className='mx-auto min-w-0 flex-1 sm:max-w-xl'
            inputClassName='h-11 rounded-full border-0 bg-background/90 pl-10 pr-4 shadow-sm md:w-full lg:w-full'
            placeholder='Search across admin...'
            showShortcut={false}
          />

          <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
            <div className='hidden sm:block'><SyncButton /></div>
            <div className='hidden md:block'><UploadMonitor /></div>
            <NotificationsPanel notifications={notifications} />
            <div className='block'><LanguageSwitcher /></div>
            <div className='block'><ThemeToggle /></div>
            <UserNav showDetails />
          </div>
        </div>
      </header>
  );
}
