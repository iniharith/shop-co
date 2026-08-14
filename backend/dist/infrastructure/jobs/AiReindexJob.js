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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAiReindexCron = startAiReindexCron;
/**
 * Coded by Harith
 * Kampungcetak ®
 * Daily vector-index reindex (3am) to keep the AI search index in sync with
 * anything that bypasses the incremental triggers (product seeding, scripts).
 */
const node_cron_1 = __importDefault(require("node-cron"));
const aiIndexService_1 = require("../../application/ai/aiIndexService");
const aiProvider_1 = require("../../infrastructure/ai/aiProvider");
const pgVectorStore_1 = require("../../infrastructure/vector/pgVectorStore");
function startAiReindexCron() {
    const enabled = process.env.AI_DAILY_REINDEX !== 'false';
    if (!enabled) {
        console.log('[Cron] 🧠 AI reindex cron disabled (AI_DAILY_REINDEX=false)');
        return;
    }
    if (!(0, aiProvider_1.aiConfigured)() || !pgVectorStore_1.pgVectorStore.isConfigured()) {
        console.log('[Cron] 🧠 AI reindex cron skipped — AI/DATABASE_URL not configured');
        return;
    }
    console.log('[Cron] 🧠 AI vector reindex registered (runs daily at 03:00)');
    node_cron_1.default.schedule('0 3 * * *', () => __awaiter(this, void 0, void 0, function* () {
        const startedAt = Date.now();
        try {
            const report = yield (0, aiIndexService_1.reindexAll)({ onProgress: () => undefined });
            console.log(`[Cron] ✅ AI reindex complete in ${Date.now() - startedAt}ms — ` +
                `products: ${report.products}, tasks: ${report.tasks}, files: ${report.files}`);
        }
        catch (err) {
            console.error('[Cron] ❌ AI reindex failed:', err === null || err === void 0 ? void 0 : err.message);
        }
    }));
}
