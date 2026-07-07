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
  const { data, isPending, isFetched, refetch, isFetching, } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime !== undefined ? options.staleTime : 60000,
  });
  return { data, isPending, isFetched, refetch, isFetching };
};
