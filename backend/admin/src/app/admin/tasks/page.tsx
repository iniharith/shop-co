/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import TasksManager from "@/components/global/tasks/tasksManager";
import { Suspense } from "react";
import LoadingAnimation from "@/components/global/LoadingAnimation";
export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4 min-w-0 w-full bg-background/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-start justify-between">
          <Heading
            title="Task Management 📋"
            description="Manage and assign tasks for your team"
          />
        </div>
        <Separator />
        <Suspense fallback={<LoadingAnimation fullScreen={false} label="Loading tasks" />}>
          <TasksManager />
        </Suspense>
      </div>
    </PageContainer>
  );
}
