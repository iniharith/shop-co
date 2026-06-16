import React from "react";
import ProfileSidebar from "@/components/page-sections/profile/profileSidebar";
import { Breadcrumbs } from "@/components/global/breadcrumb";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full py-5 md:px-10 px-5">
      <Breadcrumbs />
      <h1 className="text-3xl mt-2 font-bold tracking-tight mb-6">Profile</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar */}
        <div className="shrink-0">
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
