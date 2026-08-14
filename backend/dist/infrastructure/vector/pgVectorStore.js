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
exports.pgVectorStore = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 * pgvector-backed vector store used by the AI search engine.
 * Lazy-initialised so the API still boots when Postgres / DATABASE_URL is down.
 */
const pg_1 = require("pg");
const DEFAULT_DIM = 1536;
class PgVectorStore {
    constructor() {
        this.pool = null;
        this.dim = DEFAULT_DIM;
        this.schemaReady = null;
    }
    isConfigured() {
        return Boolean(process.env.DATABASE_URL);
    }
    connectionString() {
        const cs = process.env.DATABASE_URL;
        if (!cs)
            throw new Error('DATABASE_URL is not configured');
        return cs;
    }
    getPool() {
        if (!this.pool) {
            this.dim = parseInt(process.env.AI_EMBEDDING_DIM || String(DEFAULT_DIM), 10) || DEFAULT_DIM;
            this.pool = new pg_1.Pool({
                connectionString: this.connectionString(),
                max: 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });
            this.pool.on('error', (err) => {
                console.error('[pgvector] idle client error:', err.message);
            });
        }
        return this.pool;
    }
    /** Creates the vector extension + ai_documents table if they don't exist. */
    initSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.schemaReady) {
                this.schemaReady = (() => __awaiter(this, void 0, void 0, function* () {
                    const pool = this.getPool();
                    yield pool.query('CREATE EXTENSION IF NOT EXISTS vector');
                    yield pool.query(`
          CREATE TABLE IF NOT EXISTS ai_documents (
            id BIGSERIAL PRIMARY KEY,
            collection TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            chunk_index INT NOT NULL DEFAULT 0,
            text TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            embedding vector(${this.dim}),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (collection, entity_id, chunk_index)
          )
        `);
                    yield pool.query(`
          CREATE INDEX IF NOT EXISTS ai_documents_entity_idx
          ON ai_documents (collection, entity_id)
        `);
                    yield pool.query(`
          CREATE INDEX IF NOT EXISTS ai_documents_embedding_idx
          ON ai_documents USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `);
                    console.log('[pgvector] schema ready');
                }))().catch((err) => {
                    this.schemaReady = null;
                    throw err;
                });
            }
            return this.schemaReady;
        });
    }
    /** Serialises a number array into the literal Postgres vector syntax. */
    toVectorLiteral(embedding) {
        return '[' + embedding.join(',') + ']';
    }
    /** Inserts or updates a batch of vectors for one collection. */
    upsertBatch(collection, rows) {
        return __awaiter(this, void 0, void 0, function* () {
            if (rows.length === 0)
                return;
            yield this.initSchema();
            const pool = this.getPool();
            for (const row of rows) {
                yield pool.query(`INSERT INTO ai_documents (collection, entity_id, chunk_index, text, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
         ON CONFLICT (collection, entity_id, chunk_index)
         DO UPDATE SET
           text = EXCLUDED.text,
           metadata = EXCLUDED.metadata,
           embedding = EXCLUDED.embedding,
           updated_at = now()`, [
                    collection,
                    row.entityId,
                    row.chunkIndex,
                    row.text,
                    JSON.stringify(row.metadata),
                    this.toVectorLiteral(row.embedding),
                ]);
            }
        });
    }
    deleteEntity(collection, entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initSchema();
            yield this.getPool().query(`DELETE FROM ai_documents WHERE collection = $1 AND entity_id = $2`, [collection, entityId]);
        });
    }
    /** Cosine similarity search (1 - cosine distance) within one collection. */
    knnSearch(collection_1, embedding_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (collection, embedding, limit, minSimilarity = 0.1) {
            yield this.initSchema();
            const res = yield this.getPool().query(`SELECT id::text AS id, collection, entity_id, chunk_index, text, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM ai_documents
       WHERE collection = $2
         AND 1 - (embedding <=> $1::vector) >= $3
       ORDER BY embedding <=> $1::vector
       LIMIT $4`, [this.toVectorLiteral(embedding), collection, minSimilarity, limit]);
            return res.rows.map((row) => ({
                id: row.id,
                collection: row.collection,
                entityId: row.entity_id,
                chunkIndex: row.chunk_index,
                text: row.text,
                metadata: row.metadata,
                similarity: Number(row.similarity),
            }));
        });
    }
    /** Cross-collection search (used by admin global search). */
    knnSearchAll(embedding_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (embedding, limit, minSimilarity = 0.1) {
            yield this.initSchema();
            const res = yield this.getPool().query(`SELECT id::text AS id, collection, entity_id, chunk_index, text, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM ai_documents
       WHERE 1 - (embedding <=> $1::vector) >= $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`, [this.toVectorLiteral(embedding), minSimilarity, limit]);
            return res.rows.map((row) => ({
                id: row.id,
                collection: row.collection,
                entityId: row.entity_id,
                chunkIndex: row.chunk_index,
                text: row.text,
                metadata: row.metadata,
                similarity: Number(row.similarity),
            }));
        });
    }
    counts() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initSchema();
            const res = yield this.getPool().query(`SELECT collection, count(*)::int AS count FROM ai_documents GROUP BY collection ORDER BY collection`);
            return res.rows.map((r) => ({ collection: r.collection, count: r.count }));
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool) {
                yield this.pool.end();
                this.pool = null;
                this.schemaReady = null;
            }
        });
    }
}
exports.pgVectorStore = new PgVectorStore();
