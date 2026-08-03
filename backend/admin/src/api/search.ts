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
