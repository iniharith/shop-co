/**
 * Coded by Harith
 * Kampungcetak ®
 * One-time / manual backfill of the AI vector index (products, tasks, files).
 * Usage: npm run ai:backfill
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { reindexAll } from '../../application/ai/aiIndexService';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';

dotenv.config();

const run = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required in .env');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL (pgvector) is required in .env');
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || 'shop-co',
    serverSelectionTimeoutMS: 10_000,
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
