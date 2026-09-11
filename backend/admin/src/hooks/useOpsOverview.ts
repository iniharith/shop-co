import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getOpsOverview } from "@/api/ops";

export const useOpsOverview = () => {
  const { data: session, status } = useSession();
  return useQuery({
    queryKey: ["ops-overview"],
    queryFn: () => getOpsOverview(session?.user?.token || ""),
    enabled: status === "authenticated",
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
};
