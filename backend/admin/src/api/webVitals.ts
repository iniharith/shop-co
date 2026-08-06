import AxiosInstance from "@/utils/axios";

export type WebVitalsDays = 7 | 14 | 30 | 60 | 90;

export interface WebVitalsSummaryItem {
  metric: string;
  count: number;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  good: number;
  needsImprovement: number;
  poor: number;
  goodRate: number | null;
}

export interface WebVitalsStats {
  range: {
    days: number;
    from: string;
    timezone: string;
  };
  totalSamples: number;
  summary: WebVitalsSummaryItem[];
  trend: Array<{ date: string; [metric: string]: string | number | null }>;
  topRoutes: Array<{ route: string; count: number; p75: number | null }>;
  devices: { mobile: number; desktop: number };
}

export interface WebVitalsStatsResponse {
  success: boolean;
  data: WebVitalsStats;
}

export const getWebVitalsStats = async (
  token: string,
  days: WebVitalsDays,
): Promise<WebVitalsStats> => {
  const response = await AxiosInstance(token).get<WebVitalsStatsResponse>(
    "/api/web-vitals/stats",
    { params: { days } },
  );
  return response.data.data;
};
