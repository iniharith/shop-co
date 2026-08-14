import { ADMIN_URL } from "@/constants/api";
import { GlobalSearchResponse } from "@/types/globalSearch";
import AxiosInstance from "@/utils/axios";

export const getGlobalSearchResults = async (
  token: string,
  query: string,
  limit: number,
  signal?: AbortSignal
): Promise<GlobalSearchResponse> => {
  const response = await AxiosInstance(token).get<GlobalSearchResponse>(`${ADMIN_URL}/search`, {
    params: { q: query, limit },
    signal,
  });

  return response.data;
};

export interface AiSearchHit {
  collection: "products" | "tasks" | "files";
  entityId: string;
  score: number;
  title: string;
  snippet: string;
  metadata: Record<string, any>;
}

export interface AiSearchResponse {
  success: boolean;
  query?: string;
  expandedQueries?: string[];
  summary?: string | null;
  groups?: { products: AiSearchHit[]; tasks: AiSearchHit[]; files: AiSearchHit[] };
  tookMs?: number;
  usedAi?: boolean;
}

export const getAiSearchResults = async (
  token: string,
  query: string,
  signal?: AbortSignal
): Promise<AiSearchResponse | null> => {
  try {
    const response = await AxiosInstance(token).post<AiSearchResponse>(
      "/api/ai/search",
      {
        query,
        collections: ["products", "tasks", "files"],
        limit: 6,
        includeSummary: true,
        language: "en",
      },
      { signal }
    );
    return response.data?.success ? response.data : null;
  } catch {
    return null;
  }
};
