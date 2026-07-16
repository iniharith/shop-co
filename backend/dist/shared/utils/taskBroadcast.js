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
exports.emitTaskUpdated = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const redis_1 = require("../../infrastructure/redis/redis");
const redis_constant_1 = require("../constants/redis.constant");
const redisService = new redis_1.RedisService();
// ── Helper: broadcast a task change to every admin tab in real-time ──────────
// Consumed on the frontend by socketProvider.tsx's "task_updated" listener,
// which patches the ["tasks"] and ["task", id] React Query caches directly.
//
// Payload shapes expected by the frontend:
//   task_created / task_updated → { task: <full task object> }
//   task_deleted                → { taskId: <string id> }
const emitTaskUpdated = (event, payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisService.publish(redis_constant_1.REDIS_CHANNELS.TASK_UPDATED, JSON.stringify(Object.assign({ event }, payload)));
    }
    catch (e) {
        console.error('Failed to emit task socket event:', e);
    }
});
exports.emitTaskUpdated = emitTaskUpdated;
