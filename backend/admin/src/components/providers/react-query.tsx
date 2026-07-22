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
      retry: false, 
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
