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
const app_1 = __importDefault(require("./app"));
const db_config_1 = __importDefault(require("../config/db.config"));
const constants_1 = require("../shared/constants");
const dotenv_1 = require("dotenv");
const initProduct_script_1 = __importDefault(require("../shared/scripts/initProduct.script"));
const initAdmin_1 = require("../shared/scripts/initAdmin");
const http_1 = __importDefault(require("http"));
const socket_config_1 = __importDefault(require("../config/socket.config"));
const redis_1 = require("../infrastructure/redis/redis");
const redisMessagesHandler_1 = require("../infrastructure/redis/redisMessagesHandler");
const socketHandler_1 = require("../infrastructure/socket/socketHandler");
const TrackingCronJob_1 = require("../infrastructure/jobs/TrackingCronJob");
process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT Exception! Ignoring ...");
    console.error(err);
});
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Ignoring ...");
    console.error(err);
    // Don't exit - keep server running
});
const redisService = new redis_1.RedisService();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, dotenv_1.config)();
        yield (0, db_config_1.default)();
        yield (0, initProduct_script_1.default)();
        yield (0, initAdmin_1.initAdmin)();
        redisService.connect();
        const server = http_1.default.createServer(app_1.default);
        const io = (0, socket_config_1.default)(server);
        const clientNameSpace = io.of('/client');
        (0, socketHandler_1.socketIoSetup)(clientNameSpace);
        (0, redisMessagesHandler_1.handleRedisAndSocketMessageClient)(redisService, clientNameSpace);
        const adminNameSpace = io.of('/admin');
        (0, socketHandler_1.socketIoSetup)(adminNameSpace);
        (0, redisMessagesHandler_1.handleRedisAndSocketMessageAdmin)(redisService, adminNameSpace);
        server.listen(constants_1.PORT, () => {
            console.log(`🎉 Server running on port ${constants_1.PORT}`);
            (0, TrackingCronJob_1.startTrackingCronJob)(); // Auto-sync parcels every 15 min
        });
    });
}
const shutdown = () => {
    console.log("Shutting down gracefully...");
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
main().catch((err) => {
    console.error("Failed to Load Server 🔴:", err);
    process.exit(1);
});
