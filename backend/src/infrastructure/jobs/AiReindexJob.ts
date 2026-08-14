/**
 * Coded by Harith
 * Kampungcetak ®
 * Daily vector-index reindex (3am) to keep the AI search index in sync with
 * anything that bypasses the incremental triggers (product seeding, scripts).
 */
import cron from 'node-cron';
import { reindexAll } from '../../application/ai/aiIndexService';
import { aiConfigured } from '../../infrastructure/ai/aiProvider';
import { pgVectorStore } from '../../infrastructure/vector/pgVectorStore';

export function startAiReindexCron(): void {
  const enabled = process.env.AI_DAILY_REINDEX !== 'false';
  if (!enabled) {
    console.log('[Cron] 🧠 AI reindex cron disabled (AI_DAILY_REINDEX=false)');
    return;
  }
  if (!aiConfigured() || !pgVectorStore.isConfigured()) {
    console.log('[Cron] 🧠 AI reindex cron skipped — AI/DATABASE_URL not configured');
    return;
  }

  console.log('[Cron] 🧠 AI vector reindex registered (runs daily at 03:00)');

  cron.schedule('0 3 * * *', async () => {
    const startedAt = Date.now();
    try {
      const report = await reindexAll({ onProgress: () => undefined });
      console.log(
        `[Cron] ✅ AI reindex complete in ${Date.now() - startedAt}ms — ` +
          `products: ${report.products}, tasks: ${report.tasks}, files: ${report.files}`
      );
    } catch (err: any) {
      console.error('[Cron] ❌ AI reindex failed:', err?.message);
    }
  });
}
