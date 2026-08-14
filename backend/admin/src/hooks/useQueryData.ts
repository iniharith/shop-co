/**
 * Coded by Harith
 * Kampungcetak ®
 */
import {
  Enabled,
  QueryFunction,
  QueryKey,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

export const useQueryData = (
  queryKey: QueryKey,
  queryFn: QueryFunction,
  options?: Partial<UseQueryOptions>
) => {
  const {
    refetchInterval,
    staleTime = 60000,
    enabled,
    retry,
    retryDelay,
    ...queryOptions
  } = options || {};
  const { data, isPending, isFetched, refetch, isFetching, isError } = useQuery({
    ...queryOptions,
    queryKey,
    queryFn,
    refetchInterval,
    staleTime,
    enabled: enabled as Enabled<unknown, Error, unknown, QueryKey> | undefined,
    // Auth-dependent queries can fire the instant a component mounts, before
    // NextAuth has finished hydrating the session on a cold load (new device,
    // hard refresh, slow network). Retry a couple of times with backoff
    // instead of dying permanently on that first race-lost request.
    retry: retry !== undefined
      ? retry
      : ((failureCount: number, error: any) => {
          const status = error?.response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 1;
        }),
    retryDelay: retryDelay ?? ((attempt: number) => Math.min(1000 * 2 ** attempt, 5000)),
  });
  return { data, isPending, isFetched, refetch, isFetching, isError };
};
