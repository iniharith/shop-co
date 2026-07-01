/**
 * Coded by Harith
 * Kampungcetak ®
 */
import Redis from "ioredis";
import { config } from "dotenv";
config();

export const createRedisClient = (clientType: 'subscriber' | 'publisher' | 'standard' = 'standard') => {
    const redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;
    
    if (!redisUrl) {
        throw new Error("REDIS_URL environment variable is required");
    }

    const client = new Redis(redisUrl, {
        retryStrategy(times) {
            if (times > 10) return null;
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