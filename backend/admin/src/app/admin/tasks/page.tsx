"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import TasksManager from "@/components/global/tasks/tasksManager";

export default function Page() {
  return (
    <PageContainer nativeScroll={true}>
      <div className="flex flex-1 flex-col space-y-4 min-w-0 w-full">
        <div className="flex items-start justify-between">
          <Heading
            title="Task Management 📋"
            description="Manage and assign tasks for your team"
          />
        </div>
        <Separator />
        <TasksManager />
      </div>
    </PageContainer>
  );
}
