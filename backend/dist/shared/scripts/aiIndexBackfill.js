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
/**
 * Coded by Harith
 * Kampungcetak ®
 * One-time / manual backfill of the AI vector index (products, tasks, files).
 * Usage: npm run ai:backfill
 */
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const aiIndexService_1 = require("../../application/ai/aiIndexService");
const pgVectorStore_1 = require("../../infrastructure/vector/pgVectorStore");
dotenv_1.default.config();
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required in .env');
    }
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL (pgvector) is required in .env');
    }
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri)
        throw new Error('MONGO_URI is required');
    yield mongoose_1.default.connect(mongoUri, {
        dbName: process.env.MONGO_DB_NAME || 'shop-co',
        serverSelectionTimeoutMS: 10000,
    });
    console.log('Starting AI index backfill...');
    const report = yield (0, aiIndexService_1.reindexAll)({
        onProgress: (msg) => console.log('[ai]', msg),
    });
    console.log('Backfill complete:', report);
    const counts = yield pgVectorStore_1.pgVectorStore.counts();
    console.log('Vector index counts:', counts);
});
run()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
})
    .finally(() => {
    mongoose_1.default.disconnect().catch(() => undefined);
    pgVectorStore_1.pgVectorStore.close().catch(() => undefined);
});
