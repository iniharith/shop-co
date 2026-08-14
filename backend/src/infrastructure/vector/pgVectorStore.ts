/**
 * Coded by Harith
 * Kampungcetak ®
 * pgvector-backed vector store used by the AI search engine.
 * Lazy-initialised so the API still boots when Postgres / DATABASE_URL is down.
 */
import { Pool } from 'pg';

const DEFAULT_DIM = 1536;

export interface VectorUpsertRow {
  entityId: string;
  chunkIndex: number;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface VectorHit {
  id: string;
  collection: string;
  entityId: string;
  chunkIndex: number;
  text: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

class PgVectorStore {
  private pool: Pool | null = null;
  private dim = DEFAULT_DIM;
  private schemaReady: Promise<void> | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  private connectionString(): string {
    const cs = process.env.DATABASE_URL;
    if (!cs) throw new Error('DATABASE_URL is not configured');
    return cs;
  }

  private getPool(): Pool {
    if (!this.pool) {
      this.dim = parseInt(process.env.AI_EMBEDDING_DIM || String(DEFAULT_DIM), 10) || DEFAULT_DIM;
      this.pool = new Pool({
        connectionString: this.connectionString(),
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
      this.pool.on('error', (err) => {
        console.error('[pgvector] idle client error:', err.message);
      });
    }
    return this.pool;
  }

  /** Creates the vector extension + ai_documents table if they don't exist. */
  async initSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        const pool = this.getPool();
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
        await pool.query(`
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
        await pool.query(`
          CREATE INDEX IF NOT EXISTS ai_documents_entity_idx
          ON ai_documents (collection, entity_id)
        `);
        if (this.dim > 2000) {
          // pgvector indexes (ivfflat/hnsw) cap at 2000 dims — skip the index
          // so a misconfigured dim doesn't break the whole schema; search
          // falls back to a sequential scan.
          console.warn(`[pgvector] dim ${this.dim} exceeds the 2000-dim index limit — skipping vector index`);
        } else {
          await pool.query(`
            CREATE INDEX IF NOT EXISTS ai_documents_embedding_idx
            ON ai_documents USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
          `);
        }
        console.log('[pgvector] schema ready');
      })().catch((err) => {
        this.schemaReady = null;
        throw err;
      });
    }
    return this.schemaReady;
  }

  /** Serialises a number array into the literal Postgres vector syntax. */
  private toVectorLiteral(embedding: number[]): string {
    return '[' + embedding.join(',') + ']';
  }

  /** Inserts or updates a batch of vectors for one collection. */
  async upsertBatch(collection: string, rows: VectorUpsertRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.initSchema();
    const pool = this.getPool();

    for (const row of rows) {
      await pool.query(
        `INSERT INTO ai_documents (collection, entity_id, chunk_index, text, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
         ON CONFLICT (collection, entity_id, chunk_index)
         DO UPDATE SET
           text = EXCLUDED.text,
           metadata = EXCLUDED.metadata,
           embedding = EXCLUDED.embedding,
           updated_at = now()`,
        [
          collection,
          row.entityId,
          row.chunkIndex,
          row.text,
          JSON.stringify(row.metadata),
          this.toVectorLiteral(row.embedding),
        ]
      );
    }
  }

  async deleteEntity(collection: string, entityId: string): Promise<void> {
    await this.initSchema();
    await this.getPool().query(
      `DELETE FROM ai_documents WHERE collection = $1 AND entity_id = $2`,
      [collection, entityId]
    );
  }

  /** Cosine similarity search (1 - cosine distance) within one collection. */
  async knnSearch(
    collection: string,
    embedding: number[],
    limit: number,
    minSimilarity = 0.1
  ): Promise<VectorHit[]> {
    await this.initSchema();
    const res = await this.getPool().query(
      `SELECT id::text AS id, collection, entity_id, chunk_index, text, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM ai_documents
       WHERE collection = $2
         AND 1 - (embedding <=> $1::vector) >= $3
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      [this.toVectorLiteral(embedding), collection, minSimilarity, limit]
    );
    return res.rows.map((row) => ({
      id: row.id,
      collection: row.collection,
      entityId: row.entity_id,
      chunkIndex: row.chunk_index,
      text: row.text,
      metadata: row.metadata,
      similarity: Number(row.similarity),
    }));
  }

  /** Cross-collection search (used by admin global search). */
  async knnSearchAll(
    embedding: number[],
    limit: number,
    minSimilarity = 0.1
  ): Promise<VectorHit[]> {
    await this.initSchema();
    const res = await this.getPool().query(
      `SELECT id::text AS id, collection, entity_id, chunk_index, text, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM ai_documents
       WHERE 1 - (embedding <=> $1::vector) >= $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [this.toVectorLiteral(embedding), minSimilarity, limit]
    );
    return res.rows.map((row) => ({
      id: row.id,
      collection: row.collection,
      entityId: row.entity_id,
      chunkIndex: row.chunk_index,
      text: row.text,
      metadata: row.metadata,
      similarity: Number(row.similarity),
    }));
  }

  async counts(): Promise<{ collection: string; count: number }[]> {
    await this.initSchema();
    const res = await this.getPool().query(
      `SELECT collection, count(*)::int AS count FROM ai_documents GROUP BY collection ORDER BY collection`
    );
    return res.rows.map((r) => ({ collection: r.collection, count: r.count }));
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.schemaReady = null;
    }
  }
}

export const pgVectorStore = new PgVectorStore();
