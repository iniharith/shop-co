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
  const { data, isPending, isFetched, refetch, isFetching, isError } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime !== undefined ? options.staleTime : 60000,
    enabled: options?.enabled as Enabled<unknown, Error, unknown, QueryKey> | undefined,
    // Auth-dependent queries can fire the instant a component mounts, before
    // NextAuth has finished hydrating the session on a cold load (new device,
    // hard refresh, slow network). Retry a couple of times with backoff
    // instead of dying permanently on that first race-lost request.
    retry: options?.retry !== undefined ? options.retry : 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 5000),
  });
  return { data, isPending, isFetched, refetch, isFetching, isError };
};
