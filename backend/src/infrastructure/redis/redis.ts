/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { config } from "dotenv";
import Redis from "ioredis";
import { createRedisClient } from "../../config/redis.config";
import { REDIS_CHANNELS } from "../../shared/constants/redis.constant";
config();

const redis = createRedisClient();
const redisSubscriber = createRedisClient('subscriber');

export class RedisService {
    private redis: Redis | null;
    private redisSubscriber: Redis | null;
    constructor() {
        this.redis = redis;
        this.redisSubscriber = redisSubscriber;
    }

    connect() {
        this.redis = redis;
        
    }


    async set(key: string, value: string, ttl?: number) {
        if (!this.redis) return;
        try {
            if (ttl) {
                await this.redis.set(key, value, "EX", ttl);
            } else {
                await this.redis.set(key, value);
            }
        } catch (e) {
            console.error("Redis set error:", e);
        }
    }

    async get(key: string) {
        if (!this.redis) return null;
        try {
            return await this.redis.get(key);
        } catch (e) {
            console.error("Redis get error:", e);
            return null;
        }
    }

    async del(key: string) {
        if (!this.redis) return;
        try {
            await this.redis.del(key);
        } catch (e) {
            console.error("Redis del error:", e);
        }
    }

    async publish(channel: string, message: string) {
        if (!this.redis) return;
        try {
            console.log("🔴 publish", channel, message);
            await this.redis.publish(channel, message);
        } catch (e) {
            console.error("Redis publish error:", e);
        }
    }

    async subscribe(channel: string, callback: (message: string) => void) {
        if (!this.redisSubscriber) return;
        try {
            await this.redisSubscriber.subscribe(channel);
            this.redisSubscriber.on("message", (ch, msg) => {
                if (ch === channel) callback(msg);
            });
        } catch (e) {
            console.error("Redis subscribe error:", e);
        }
    }

    on(event: string, callback: (channel: string, message: string) => void) {
        if (!this.redisSubscriber) {
            return;
        }
        this.redisSubscriber.on(event, callback);
    }




}


