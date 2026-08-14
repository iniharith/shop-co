/**
 * Coded by Harith
 * Kampungcetak ®
 * Client-side helpers for the AI semantic search endpoints.
 * AI is opt-in per environment: set NEXT_PUBLIC_AI_SEARCH_ENABLED=true.
 */

export const AI_SEARCH_ENABLED = process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED === 'true';

export interface AiHit {
  collection: 'products' | 'tasks' | 'files';
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
  groups?: { products: AiHit[]; tasks: AiHit[]; files: AiHit[] };
  tookMs?: number;
  usedAi?: boolean;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/** Semantic search. Returns null (not throws) when disabled/failing so callers fall back to keyword search. */
export async function aiSemanticSearch(
  query: string,
  opts: { collections?: string[]; limit?: number; language?: 'ms' | 'en' } = {}
): Promise<AiSearchResponse | null> {
  if (!AI_SEARCH_ENABLED) return null;
  try {
    const res = await fetch(`${API}/api/ai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...opts }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) return null;
    return data;
  } catch {
    return null;
  }
}

/** Alternate queries from the LLM while the user types. Empty array when disabled/failing. */
export async function aiSearchSuggestions(query: string): Promise<string[]> {
  if (!AI_SEARCH_ENABLED) return [];
  try {
    const res = await fetch(`${API}/api/ai/search/suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) return [];
    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch {
    return [];
  }
}
