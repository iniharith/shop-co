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
      refetchOnMount: true, 
      refetchOnReconnect: "always", 
      retry: 2, 
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 60000, 
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
