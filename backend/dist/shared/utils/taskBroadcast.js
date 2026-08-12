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
const socketRegistry_1 = require("../../infrastructure/socket/socketRegistry");
const redisService = new redis_1.RedisService();
// ── Helper: broadcast a task change to every admin tab in real-time ──────────
// Consumed on the frontend by socketProvider.tsx's "task_updated" listener,
// which patches the ["tasks"] and ["task", id] React Query caches directly.
//
// Emits directly on the local /admin socket namespace so a single Railway
// instance stays real-time even if Redis is down; the Redis publish is kept
// for multi-instance fan-out.
//
// Payload shapes expected by the frontend:
//   task_created / task_updated → { task: <full task object> }
//   task_deleted                → { taskId: <string id> }
const emitTaskUpdated = (event, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const message = Object.assign({ event }, payload);
    const adminNamespace = (0, socketRegistry_1.getAdminNamespace)();
    if (adminNamespace) {
        try {
            adminNamespace.emit(event, message);
        }
        catch (e) {
            console.error('Failed to emit task socket event locally:', e);
        }
    }
    try {
        yield redisService.publish(redis_constant_1.REDIS_CHANNELS.TASK_UPDATED, JSON.stringify(message));
    }
    catch (e) {
        console.error('Failed to emit task socket event:', e);
    }
});
exports.emitTaskUpdated = emitTaskUpdated;
