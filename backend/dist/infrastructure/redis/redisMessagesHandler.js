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
exports.handleRedisAndSocketMessageClient = handleRedisAndSocketMessageClient;
exports.handleRedisAndSocketMessageAdmin = handleRedisAndSocketMessageAdmin;
const redis_constant_1 = require("../../shared/constants/redis.constant");
const socketHandler_1 = require("../socket/socketHandler");
function handleRedisAndSocketMessageClient(redisService, io) {
    //   enum to array
    const channels = Object.values(redis_constant_1.REDIS_CHANNELS);
    channels.forEach((channel) => __awaiter(this, void 0, void 0, function* () {
        yield redisService.subscribe(channel);
    }));
    redisService.on("message", (channel, message) => __awaiter(this, void 0, void 0, function* () {
        switch (channel) {
            case redis_constant_1.REDIS_CHANNELS.NOTIFICATION:
                const data = JSON.parse(message);
                const socketId = (yield (0, socketHandler_1.getReceiverSocketId)(data === null || data === void 0 ? void 0 : data.userId)) || null;
                if (socketId) {
                    console.log("🟢 sending notification to user", data === null || data === void 0 ? void 0 : data.userId, socketId);
                    io.to(socketId).emit("notification", data);
                }
                else {
                    console.log("🔴 no socket id found for user", data === null || data === void 0 ? void 0 : data.userId);
                }
                break;
        }
    }));
}
function handleRedisAndSocketMessageAdmin(redisService, io) {
    //   enum to array
    const channels = Object.values(redis_constant_1.REDIS_CHANNELS);
    channels.forEach((channel) => __awaiter(this, void 0, void 0, function* () {
        yield redisService.subscribe(channel);
    }));
    redisService.on("message", (channel, message) => __awaiter(this, void 0, void 0, function* () {
        switch (channel) {
            case redis_constant_1.REDIS_CHANNELS.ORDER_PLACED:
                console.log("🟢 order placed", message);
                io.emit("order_placed", message);
                break;
            case redis_constant_1.REDIS_CHANNELS.NOTIFICATION:
                const data = JSON.parse(message);
                const socketId = (yield (0, socketHandler_1.getReceiverSocketId)(data === null || data === void 0 ? void 0 : data.userId)) || null;
                if (socketId) {
                    console.log("🟢 sending notification to admin", data === null || data === void 0 ? void 0 : data.userId, socketId);
                    io.to(socketId).emit("notification", data);
                }
                else {
                    console.log("🔴 no socket id found for admin", data === null || data === void 0 ? void 0 : data.userId);
                }
                break;
        }
    }));
}
