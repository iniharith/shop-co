import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getQueueAnalytics, type QueueAnalyticsDays } from "@/api/queue-analytics";

export const useQueueAnalytics = (days: QueueAnalyticsDays) => {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ["queue-analytics", days],
    queryFn: () => getQueueAnalytics(session?.user?.token || "", days),
    enabled: status === "authenticated",
  });
};
