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
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis) {
                return;
            }
            if (ttl) {
                yield this.redis.set(key, value, "EX", ttl);
            }
            else {
                yield this.redis.set(key, value);
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis) {
                return;
            }
            return yield this.redis.get(key);
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis) {
                return;
            }
            yield this.redis.del(key);
        });
    }
    publish(channel, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.redis) {
                return;
            }
            console.log("🔴 publish", channel, message);
            yield ((_a = this.redis) === null || _a === void 0 ? void 0 : _a.publish(channel, message));
        });
    }
    subscribe(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redisSubscriber) {
                return;
            }
            yield this.redisSubscriber.subscribe(channel, (err, count) => {
                if (err) {
                    console.error('Failed to subscribe:', err);
                    return;
                }
                console.log(`Subscribed to ${channel}. Now listening for messages...`);
            });
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
