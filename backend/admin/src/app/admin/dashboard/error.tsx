"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function OverviewError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Alert variant="destructive" className="m-4">
      <CircleAlert className="size-4" />
      <AlertTitle>Dashboard unavailable</AlertTitle>
      <AlertDescription className="mt-1">Statistics could not be loaded. Retry the request or reload the page.</AlertDescription>
      <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
        <RotateCcw className="mr-2 size-4" />Retry
      </Button>
    </Alert>
  );
}
