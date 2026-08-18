/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { RoleWidgets } from "@/components/global/dashboard/RoleWidgets";
import SeedDataButton from "@/components/global/dashboard/seedDataButton";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function Page() {
  const { t } = useLanguage();
  return (
    <>
      <div className="flex px-4 py-2 items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("dashboard.welcome")}
        </h2>
        <SeedDataButton />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <RoleWidgets />
      </div>
    </> 
  );
}
