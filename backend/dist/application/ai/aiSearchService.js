"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_SEARCH_COLLECTIONS = void 0;
exports.expandSearchQueries = expandSearchQueries;
exports.summarizeResults = summarizeResults;
exports.aiSearch = aiSearch;
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
const pgVectorStore_1 = require("../../infrastructure/vector/pgVectorStore");
const aiProvider_1 = require("../../infrastructure/ai/aiProvider");
const aiIndexService_1 = require("./aiIndexService");
exports.AI_SEARCH_COLLECTIONS = [
    aiIndexService_1.AI_COLLECTIONS.products,
    aiIndexService_1.AI_COLLECTIONS.tasks,
    aiIndexService_1.AI_COLLECTIONS.files,
];
function truncate(text, max = 200) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? clean.slice(0, max) + '…' : clean;
}
/** Generates 3-5 alternate search queries from the user's natural-language input. */
function expandSearchQueries(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const system = [
            'You are a search query expander for a Malaysian printing e-commerce platform (Kampung Cetak).',
            'Products include flyers, wedding cards (kad kahwin), banners, money packets, photobooks, display items, apparel and more.',
            'Given a user query in Malay or English, generate 3 to 5 short alternate search queries that capture the same intent.',
            'Include Malay and English variations, synonyms, and related terms.',
            'Reply ONLY with JSON: {"queries": ["...", "..."]}.',
        ].join(' ');
        const result = yield (0, aiProvider_1.generateJson)(system, `User query: "${query}"`);
        const queries = Array.isArray(result.queries)
            ? result.queries.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(0, 5)
            : [];
        return [query, ...queries];
    });
}
/** Generates a natural-language summary of the top hits for a query. */
function summarizeResults(query, groups, language) {
    return __awaiter(this, void 0, void 0, function* () {
        const system = [
            `You are the search assistant for Kampung Cetak (a Malaysian printing shop).`,
            `Write a helpful, concise natural-language summary of the search results for the user's query, in ${language === 'ms' ? 'Bahasa Melayu' : 'English'}.`,
            `Max 3 short sentences. Mention how many products/tasks/files were found and the most relevant match(es).`,
            `If nothing relevant was found, say so politely. Reply ONLY with JSON: {"summary": "..."}`,
        ].join(' ');
        const describe = (hits) => hits
            .map((h) => `- [${h.metadata.name || h.metadata.title || h.metadata.originalName || h.entityId}] (${(h.score * 100).toFixed(0)}% match): ${truncate(h.snippet, 140)}`)
            .join('\n');
        const user = [
            `User query: "${query}"`,
            `Products:\n${describe(groups.products) || '(tiada)'}`,
            `Tasks:\n${describe(groups.tasks) || '(tiada)'}`,
            `Files:\n${describe(groups.files) || '(tiada)'}`,
        ].join('\n\n');
        const result = yield (0, aiProvider_1.generateJson)(system, user, { maxTokens: 512 });
        return (result.summary || '').trim();
    });
}
/**
 * Runs semantic search. If OpenAI is not configured, throws — callers must
 * catch and fall back to their existing keyword search.
 */
function aiSearch(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, opts = {}) {
        var _a, _b, _c;
        if (!(0, aiProvider_1.aiConfigured)())
            throw new Error('AI is not configured');
        const startedAt = Date.now();
        const language = opts.language || 'ms';
        const limit = Math.min(Math.max((_a = opts.limit) !== null && _a !== void 0 ? _a : 8, 1), 20);
        const minSimilarity = (_b = opts.minSimilarity) !== null && _b !== void 0 ? _b : 0.15;
        const collections = ((_c = opts.collections) === null || _c === void 0 ? void 0 : _c.length)
            ? [...new Set(opts.collections)]
            : [...exports.AI_SEARCH_COLLECTIONS];
        // 1. Query expansion (requirement 1)
        const expandedQueries = yield expandSearchQueries(query);
        // 2. Embed every expanded query in one batch
        const embeddings = yield (0, aiProvider_1.embedTexts)(expandedQueries);
        // 3. Vector search per collection, keep the best score per entity across queries
        const bestByCollection = {
            [aiIndexService_1.AI_COLLECTIONS.products]: new Map(),
            [aiIndexService_1.AI_COLLECTIONS.tasks]: new Map(),
            [aiIndexService_1.AI_COLLECTIONS.files]: new Map(),
        };
        for (const collection of collections) {
            if (!(collection in bestByCollection))
                continue;
            const map = bestByCollection[collection];
            for (const embedding of embeddings) {
                const hits = yield pgVectorStore_1.pgVectorStore.knnSearch(collection, embedding, limit, minSimilarity);
                for (const hit of hits) {
                    const meta = (hit.metadata || {});
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
        const groups = {
            [aiIndexService_1.AI_COLLECTIONS.products]: [],
            [aiIndexService_1.AI_COLLECTIONS.tasks]: [],
            [aiIndexService_1.AI_COLLECTIONS.files]: [],
        };
        for (const collection of collections) {
            groups[collection] = [...bestByCollection[collection].values()]
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }
        // 5. Natural-language summary (requirement 4)
        let summary = null;
        if (opts.includeSummary !== false) {
            try {
                summary = yield summarizeResults(query, groups, language);
            }
            catch (err) {
                console.error('[ai] summary generation failed:', err.message);
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
    });
}
