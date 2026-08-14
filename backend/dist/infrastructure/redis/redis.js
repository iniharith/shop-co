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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const dotenv_1 = require("dotenv");
const redis_config_1 = require("../../config/redis.config");
(0, dotenv_1.config)();
const redis = (0, redis_config_1.createRedisClient)();
const redisSubscriber = (0, redis_config_1.createRedisClient)('subscriber');
class RedisService {
    constructor() {
        this.redis = redis;
        this.redisSubscriber = redisSubscriber;
    }
    connect() {
        this.redis = redis;
    }
    isReady() {
        var _a;
        return ((_a = this.redis) === null || _a === void 0 ? void 0 : _a.status) === 'ready';
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return;
            try {
                if (ttl) {
                    yield this.redis.set(key, value, "EX", ttl);
                }
                else {
                    yield this.redis.set(key, value);
                }
            }
            catch (e) {
                console.error("Redis set error:", e);
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return null;
            try {
                return yield this.redis.get(key);
            }
            catch (e) {
                console.error("Redis get error:", e);
                return null;
            }
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return;
            try {
                yield this.redis.del(key);
            }
            catch (e) {
                console.error("Redis del error:", e);
            }
        });
    }
    delByPrefix(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return;
            try {
                let cursor = '0';
                do {
                    const [nextCursor, keys] = yield this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
                    cursor = nextCursor;
                    if (keys.length)
                        yield this.redis.del(...keys);
                } while (cursor !== '0');
            }
            catch (e) {
                console.error("Redis prefix delete error:", e);
            }
        });
    }
    publish(channel, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return;
            try {
                console.log("🔴 publish", channel, message);
                yield this.redis.publish(channel, message);
            }
            catch (e) {
                console.error("Redis publish error:", e);
            }
        });
    }
    subscribe(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redisSubscriber)
                return;
            try {
                yield this.redisSubscriber.subscribe(channel, (err, count) => {
                    if (err) {
                        console.error('Failed to subscribe:', err);
                        return;
                    }
                    console.log(`Subscribed to ${channel}. Now listening for messages...`);
                });
            }
            catch (e) {
                console.error("Redis subscribe error:", e);
            }
        });
    }
    on(event, callback) {
        if (!this.redisSubscriber) {
            return;
        }
        this.redisSubscriber.on(event, callback);
    }
}
exports.RedisService = RedisService;
