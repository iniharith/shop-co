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
    const redisUrl = process.env.REDIS_URL
        || process.env.REDIS_PUBLIC_URL
        || (process.env.REDIS_HOST
            ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
            : undefined);
    if (!redisUrl) {
        console.warn(`[Warning] Redis configuration is missing. Redis ${clientType} client will be disabled.`);
        return null;
    }
    const client = new ioredis_1.default(redisUrl, {
        retryStrategy(times) {
            if (times > 10)
                return null;
            return Math.min(times * 100, 3000);
        },
        // Most managed Redis hosts (Upstash, Railway, etc.) silently close
        // TCP connections that sit idle for too long. Without a keepalive
        // ping, the client only discovers this the next time it tries to
        // use the socket — which is exactly what was showing up as a tight
        // ECONNRESET / reconnect loop in the logs. 10s keepalive pings
        // keep the connection alive so it doesn't get dropped in the first
        // place.
        keepAlive: 10000,
        // Queue commands issued during a brief reconnect instead of
        // instantly rejecting them with "Stream isn't writeable" — that
        // instant-reject behavior (the previous enableOfflineQueue: false)
        // is what turned every reconnect blip into a wave of failed
        // subscribe/publish/get/set calls across the app.
        enableOfflineQueue: true,
        // Allow a few retries per request instead of giving up after just
        // one — 1 was too aggressive given how often this host cycles the
        // connection.
        maxRetriesPerRequest: 5,
        enableReadyCheck: true,
        lazyConnect: false,
        commandTimeout: 5000,
        reconnectOnError(err) {
            // Force a reconnect (rather than just erroring out) for the
            // exact class of error seen in the logs.
            if (/ECONNRESET|ETIMEDOUT|READONLY/.test(err.message))
                return true;
            return false;
        },
    });
    client.on("error", (err) => {
        console.error(`Redis ${clientType} client error:`, err.message);
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
