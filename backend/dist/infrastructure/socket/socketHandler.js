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
exports.getReceiverSocketId = exports.socketIoSetup = void 0;
const user_repository_1 = require("../db/repositories/user.repository");
const userSocketMap = new Map();
const socketIoSetup = (io) => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = new user_repository_1.UserRepository();
    // listen when client is connected to socket
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        // const socketController = new SocketController(io);
        const userId = socket.handshake.query["userId"];
        console.log("🟡 user conneted to socket from id:", socket.id, userId);
        if (userId && userId !== null && !!userId) {
            try {
                const user = yield userRepository.findById(userId);
                if (user) {
                    // socket.join(userId as string)
                    userSocketMap.set(userId, socket.id);
                    io.to(socket.id).emit("joined", {
                        message: `🔵 user:${user === null || user === void 0 ? void 0 : user.name} joined room `
                    });
                    console.log(`🟢 user data updated , ${user.name} is online`);
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
