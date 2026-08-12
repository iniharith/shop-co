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
exports.getOnlineUsersCount = exports.getReceiverSocketId = exports.socketIoSetup = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const user_repository_1 = require("../db/repositories/user.repository");
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const redis_1 = require("../redis/redis");
const redis_constant_1 = require("../../shared/constants/redis.constant");
const userSocketMap = new Map();
const socketIoSetup = (io) => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = new user_repository_1.UserRepository();
    const redisService = new redis_1.RedisService();
    const adminRoles = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];
    if (io.name === '/admin') {
        io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
                if (!token)
                    return next(new Error('Unauthorized'));
                const { userId } = new jwt_1.default().verifyAccessToken(token);
                if (!userId)
                    return next(new Error('Unauthorized'));
                const user = yield userRepository.findById(userId);
                if (!user || !adminRoles.includes(user.role)) {
                    return next(new Error('Unauthorized'));
                }
                socket.data.userId = userId.toString();
                socket.data.user = user;
                next();
            }
            catch (_b) {
                next(new Error('Unauthorized'));
            }
        }));
    }
    // listen when client is connected to socket
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.data.userId || socket.handshake.query["userId"];
        console.log("🟡 user conneted to socket from id:", socket.id, userId);
        if (userId && userId !== null && !!userId) {
            try {
                const user = socket.data.user || (yield userRepository.findById(userId));
                if (user) {
                    // socket.join(userId as string)
                    userSocketMap.set(userId, socket.id);
                    io.to(socket.id).emit("joined", {
                        message: `🔵 user:${user === null || user === void 0 ? void 0 : user.name} joined room `
                    });
                    console.log(`🟢 user data updated , ${user.name} is online`);
                    if (io.name === '/admin') {
                        socket.emit('realtime_status', { ready: redisService.isReady() });
                    }
                    const realtimeStatusInterval = io.name === '/admin'
                        ? setInterval(() => socket.emit('realtime_status', { ready: redisService.isReady() }), 2000)
                        : null;
                    if (io.name === '/admin') {
                        // Relay live-typing updates to the TASK_TYPING channel so
                        // other admins viewing the same task see the text as it is
                        // typed (Asana-style). Payload mirrors the client's emit.
                        socket.on('task_typing', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                            try {
                                const message = Object.assign(Object.assign({}, (payload || {})), { userId, userName: (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || 'Someone' });
                                yield redisService.publish(redis_constant_1.REDIS_CHANNELS.TASK_TYPING, JSON.stringify(message));
                            }
                            catch (e) {
                                console.error('Failed to relay task_typing:', e);
                            }
                        }));
                    }
                    socket.on('disconnect', () => {
                        if (realtimeStatusInterval)
                            clearInterval(realtimeStatusInterval);
                        if (userSocketMap.get(userId) === socket.id) {
                            userSocketMap.delete(userId);
                        }
                    });
                }
                else {
                    userSocketMap.delete(userId);
                    console.log("🔴 user is not found");
                    socket.disconnect();
                }
            }
            catch (error) {
                console.log("🔴 error on while updateing user", error.message);
            }
        }
        else
            console.log("🔴 user id is not found ");
    }));
});
exports.socketIoSetup = socketIoSetup;
const getReceiverSocketId = (userId) => {
    const getd = userSocketMap.get(userId);
    console.log("🟡 getReceiverSocketId", getd, userSocketMap);
    return getd;
};
exports.getReceiverSocketId = getReceiverSocketId;
const getOnlineUsersCount = () => {
    return userSocketMap.size;
};
exports.getOnlineUsersCount = getOnlineUsersCount;
