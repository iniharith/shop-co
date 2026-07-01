"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const createRedisClient = (clientType = 'standard') => {
    const redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;
    if (!redisUrl) {
        console.warn(`[Warning] REDIS_URL environment variable is missing. Redis ${clientType} client will be disabled.`);
        return null;
    }
    const client = new ioredis_1.default(redisUrl, {
        retryStrategy(times) {
            if (times > 10)
                return null;
            return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false
    });
    client.on("error", (err) => {
        console.error(`Redis ${clientType} client error:`, err);
    });
    client.on("connect", () => {
        console.log(`Redis ${clientType} client connected 🎉`);
    });
    client.on("reconnecting", () => {
        console.log(`Redis ${clientType} client reconnecting...`);
    });
    return client;
};
exports.createRedisClient = createRedisClient;
