import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getWebVitalsStats, type WebVitalsDays } from "@/api/webVitals";

export const useWebVitalsStats = (days: WebVitalsDays) => {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["web-vitals-stats", days],
    queryFn: () => getWebVitalsStats(session?.user?.token || "", days),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
};
