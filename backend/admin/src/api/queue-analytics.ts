import AxiosInstance from "@/utils/axios";

export type QueueAnalyticsDays = 7 | 14 | 30 | 60 | 90;

export interface QueueAnalyticsData {
  range: {
    days: number;
    from: string;
    to: string;
    timezone: string;
  };
  dataQuality: {
    mode: "historical" | "mixed" | "legacy_estimated";
    historicalCompletedInRange: number;
    legacyEstimatedCompletedInRange: number;
    note: string;
  };
  summary: {
    currentWip: number;
    overdueTasks: number;
    overdueRate: number;
    unassignedTasks: number;
    completedInRange: number;
    avgCompletionHours: number | null;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
    avgAgeHours: number;
    overdue: number;
  }>;
  staffWorkload: Array<{
    assigneeId: string | null;
    assigneeName: string;
    count: number;
    overdue: number;
    oldestAgeHours: number;
  }>;
  bottlenecks: Array<{
    status: string;
    count: number;
    avgAgeHours: number;
    overdue: number;
    score: number;
  }>;
  dailyThroughput: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  oldestTasks: Array<{
    id: string;
    title: string;
    status: string;
    assigneeId?: string;
    assigneeName?: string;
    orderId?: string;
    dueDate?: string;
    ageHours: number;
  }>;
}

interface QueueAnalyticsResponse {
  success: true;
  data: QueueAnalyticsData;
}

export const getQueueAnalytics = async (
  token: string,
  days: QueueAnalyticsDays,
): Promise<QueueAnalyticsData> => {
  const response = await AxiosInstance(token).get<QueueAnalyticsResponse>(
    "/api/sysadmin/queue-analytics",
    { params: { days } },
  );

  return response.data.data;
};
