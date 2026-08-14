/**
 * Coded by Harith
 * Kampungcetak ®
 * AI-powered semantic search:
 *  1. LLM expands the user query into multiple search queries
 *  2. Each query is embedded (text-embedding-3-small)
 *  3. pgvector cosine similarity search per collection
 *  4. Results merged + deduped
 *  5. LLM writes a natural-language search summary
 */
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';
import {
  aiConfigured,
  embedTexts,
  generateJson,
} from '../../infrastructure/ai/aiProvider';
import { AI_COLLECTIONS } from './aiIndexService';

export const AI_SEARCH_COLLECTIONS = [
  AI_COLLECTIONS.products,
  AI_COLLECTIONS.tasks,
  AI_COLLECTIONS.files,
] as const;

export type AiCollection = (typeof AI_SEARCH_COLLECTIONS)[number];

export interface AiSearchHit {
  collection: AiCollection;
  entityId: string;
  score: number;
  title: string;
  snippet: string;
  metadata: Record<string, unknown>;
}

export interface AiSearchResult {
  query: string;
  expandedQueries: string[];
  summary: string | null;
  groups: Record<AiCollection, AiSearchHit[]>;
  tookMs: number;
  usedAi: boolean;
}

interface AiSearchOptions {
  collections?: AiCollection[];
  limit?: number;
  includeSummary?: boolean;
  language?: 'ms' | 'en';
  minSimilarity?: number;
}

function truncate(text: string, max = 200): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

/** Generates 3-5 alternate search queries from the user's natural-language input. */
export async function expandSearchQueries(query: string): Promise<string[]> {
  const system = [
    'You are a search query expander for a Malaysian printing e-commerce platform (Kampung Cetak).',
    'Products include flyers, wedding cards (kad kahwin), banners, money packets, photobooks, display items, apparel and more.',
    'Given a user query in Malay or English, generate 3 to 5 short alternate search queries that capture the same intent.',
    'Include Malay and English variations, synonyms, and related terms.',
    'Reply ONLY with JSON: {"queries": ["...", "..."]}.',
  ].join(' ');

  const result = await generateJson<{ queries: string[] }>(
    system,
    `User query: "${query}"`
  );
  const queries = Array.isArray(result.queries)
    ? result.queries.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(0, 5)
    : [];
  return [query, ...queries];
}

/** Generates a natural-language summary of the top hits for a query. */
export async function summarizeResults(
  query: string,
  groups: Record<AiCollection, AiSearchHit[]>,
  language: 'ms' | 'en'
): Promise<string> {
  const system = [
    `You are the search assistant for Kampung Cetak (a Malaysian printing shop).`,
    `Write a helpful, concise natural-language summary of the search results for the user's query, in ${language === 'ms' ? 'Bahasa Melayu' : 'English'}.`,
    `Max 3 short sentences. Mention how many products/tasks/files were found and the most relevant match(es).`,
    `If nothing relevant was found, say so politely. Reply ONLY with JSON: {"summary": "..."}`,
  ].join(' ');

  const describe = (hits: AiSearchHit[]) =>
    hits
      .map(
        (h) =>
          `- [${h.metadata.name || h.metadata.title || h.metadata.originalName || h.entityId}] (${(h.score * 100).toFixed(0)}% match): ${truncate(h.snippet, 140)}`
      )
      .join('\n');

  const user = [
    `User query: "${query}"`,
    `Products:\n${describe(groups.products) || '(tiada)'}`,
    `Tasks:\n${describe(groups.tasks) || '(tiada)'}`,
    `Files:\n${describe(groups.files) || '(tiada)'}`,
  ].join('\n\n');

  const result = await generateJson<{ summary: string }>(system, user, { maxTokens: 512 });
  return (result.summary || '').trim();
}

/**
 * Runs semantic search. If OpenAI is not configured, throws — callers must
 * catch and fall back to their existing keyword search.
 */
export async function aiSearch(
  query: string,
  opts: AiSearchOptions = {}
): Promise<AiSearchResult> {
  if (!aiConfigured()) throw new Error('AI is not configured');

  const startedAt = Date.now();
  const language = opts.language || 'ms';
  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 20);
  const minSimilarity = opts.minSimilarity ?? 0.15;
  const collections = opts.collections?.length
    ? [...new Set(opts.collections)]
    : [...AI_SEARCH_COLLECTIONS];

  // 1. Query expansion (requirement 1)
  const expandedQueries = await expandSearchQueries(query);

  // 2. Embed every expanded query in one batch
  const embeddings = await embedTexts(expandedQueries);

  // 3. Vector search per collection, keep the best score per entity across queries
  const bestByCollection: Record<string, Map<string, AiSearchHit>> = {
    [AI_COLLECTIONS.products]: new Map(),
    [AI_COLLECTIONS.tasks]: new Map(),
    [AI_COLLECTIONS.files]: new Map(),
  };

  for (const collection of collections) {
    if (!(collection in bestByCollection)) continue;
    const map = bestByCollection[collection];
    for (const embedding of embeddings) {
      const hits = await pgVectorStore.knnSearch(collection, embedding, limit, minSimilarity);
      for (const hit of hits) {
        const meta = (hit.metadata || {}) as Record<string, any>;
        const title = meta.name || meta.title || meta.originalName || hit.entityId;
        const score = hit.similarity;
        const existing = map.get(hit.entityId);
        if (!existing || score > existing.score) {
          map.set(hit.entityId, {
            collection,
            entityId: hit.entityId,
            score,
            title,
            snippet: hit.text,
            metadata: meta,
          });
        }
      }
    }
  }

  // 4. Sort by score, cap per group
  const groups: Record<AiCollection, AiSearchHit[]> = {
    [AI_COLLECTIONS.products]: [],
    [AI_COLLECTIONS.tasks]: [],
    [AI_COLLECTIONS.files]: [],
  };
  for (const collection of collections) {
    groups[collection] = [...bestByCollection[collection].values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 5. Natural-language summary (requirement 4)
  let summary: string | null = null;
  if (opts.includeSummary !== false) {
    try {
      summary = await summarizeResults(query, groups, language);
    } catch (err) {
      console.error('[ai] summary generation failed:', (err as Error).message);
    }
  }

  return {
    query,
    expandedQueries,
    summary,
    groups,
    tookMs: Date.now() - startedAt,
    usedAi: true,
  };
}
