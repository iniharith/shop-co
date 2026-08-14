/**
 * Coded by Harith
 * Kampungcetak ®
 * One-time / manual backfill of the AI vector index (products, tasks, files).
 * Usage: npm run ai:backfill
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { reindexAll } from '../../application/ai/aiIndexService';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';
import { aiConfigured } from '../../infrastructure/ai/aiProvider';

dotenv.config();

// Same DNS workaround as src/config/db.config.ts — Telekom Malaysia's IPv6
// DNS breaks SRV lookups, so force Google DNS + IPv4.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const run = async () => {
  if (!aiConfigured()) {
    throw new Error(
      'AI_PROVIDER is not configured — set AI_PROVIDER=gemini + GEMINI_API_KEY or OPENAI_API_KEY in .env'
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL (pgvector) is required in .env');
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || 'shop-co',
    serverSelectionTimeoutMS: 10_000,
    family: 4,
  });

  console.log('Starting AI index backfill...');
  const report = await reindexAll({
    onProgress: (msg) => console.log('[ai]', msg),
  });

  console.log('Backfill complete:', report);

  const counts = await pgVectorStore.counts();
  console.log('Vector index counts:', counts);
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    mongoose.disconnect().catch(() => undefined);
    pgVectorStore.close().catch(() => undefined);
  });
