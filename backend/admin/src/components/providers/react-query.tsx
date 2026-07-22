/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

type Props = { children: React.ReactNode };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      refetchOnMount: false,
      refetchOnReconnect: true,
      // A single failed request (e.g. a transient backend/Redis hiccup)
      // used to permanently strand that page in an empty state for the
      // rest of the browser session, since nothing ever retried it and
      // refetchOnMount is off. Retry a couple of times with a short
      // backoff before actually giving up.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes
    },

    mutations: {
      retry: false, 
    },
  },
});

const ReactQueryProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
