import AxiosInstance from "@/utils/axios";

export type OpsState = "healthy" | "degraded" | "down" | "stale" | "not_configured";
export type OpsStatus = {
  configured: boolean;
  state: OpsState;
  checkedAt: string | null;
  latencyMs: number | null;
  detail?: Record<string, string | number | boolean | null>;
};

export type OpsOverview = {
  generatedAt: string;
  telemetry: {
    requests: { windowSeconds: number; requests: number; requestsPerMinute: number; serverErrors: number; errorRatePercent: number; latencyMs: { p50: number; p95: number } };
    process: { uptimeSeconds: number; cpuPercent: number; memoryBytes: { heapUsed: number; heapTotal: number; rss: number }; eventLoopLagMs: { mean: number; p95: number } };
    recentTraces: Array<{ requestId: string; method: string; route: string; status: number; durationMs: number; timestamp: string }>;
    traceCapacity: number;
  };
  dependencies: Record<"mongo" | "redis" | "s3" | "vercel" | "railway", OpsStatus>;
  network: { sampleIntervalSeconds: number; bandwidth: Array<{ timestamp: string; bytesIn: number; bytesOut: number }> };
};

export const getOpsOverview = async (token: string) => {
  const response = await AxiosInstance(token).get<{ success: boolean; data: OpsOverview }>("/api/sysadmin/ops-overview");
  return response.data.data;
};
