"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getGlobalSearchResults } from "@/api/search";
import { useDebounce } from "@/hooks/use-debounce";
import { GlobalSearchResponse } from "@/types/globalSearch";

export const GLOBAL_SEARCH_MIN_LENGTH = 2;
export const GLOBAL_SEARCH_DEBOUNCE_MS = 180;

export const useGlobalSearch = (query: string, limit = 5) => {
  const { data: session, status } = useSession();
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebounce(normalizedQuery, GLOBAL_SEARCH_DEBOUNCE_MS);

  const result = useQuery<GlobalSearchResponse>({
    queryKey: ["admin-global-search", debouncedQuery, limit],
    queryFn: ({ signal }) =>
      getGlobalSearchResults(session?.user?.token || "", debouncedQuery, limit, signal),
    enabled:
      status === "authenticated" &&
      debouncedQuery.length >= GLOBAL_SEARCH_MIN_LENGTH,
    staleTime: 30_000,
    retry: (failureCount, error: any) => {
      const responseStatus = error?.response?.status;
      if (responseStatus === 401 || responseStatus === 403) return false;
      return failureCount < 1;
    },
  });

  return {
    ...result,
    debouncedQuery,
    isDebouncing:
      normalizedQuery.length >= GLOBAL_SEARCH_MIN_LENGTH &&
      normalizedQuery !== debouncedQuery,
  };
};
