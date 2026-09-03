/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import ProfileSidebar from "@/components/page-sections/profile/profileSidebar";
import { Breadcrumbs } from "@/components/global/breadcrumb";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="profile-area w-full bg-[#0c1012] py-6 md:px-10 px-4 text-[#f7f3e8]">
      <Breadcrumbs />
      <div className="mt-5 mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6a21d]">Account / Akaun</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your space, your orders</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">Manage your profile, artwork and Kampung Cetak activity in one place.</p>
        </div>
        <div className="hidden rounded-full border border-[#d6a21d]/30 bg-[#d6a21d]/10 px-4 py-2 text-xs font-semibold text-[#f2c14e] md:block">
          Kampung Cetak member
        </div>
      </div>
      <div className="flex w-full flex-col gap-6 md:flex-row md:gap-8">
        {/* Sidebar */}
        <div className="shrink-0 md:w-64">
          <ProfileSidebar />
        </div>
        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
