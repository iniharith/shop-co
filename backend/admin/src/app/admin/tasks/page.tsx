/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
        <Separator />
        <Suspense fallback={<div>Loading tasks...</div>}>
          <TasksManager />
        </Suspense>
      </div>
    </PageContainer>
  );
}
