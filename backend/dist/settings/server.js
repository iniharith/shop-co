"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
require("../instrumentation");
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
const socketRegistry_1 = require("../infrastructure/socket/socketRegistry");
const TrackingCronJob_1 = require("../infrastructure/jobs/TrackingCronJob");
const TaskStatusAutoTransition_1 = require("../infrastructure/jobs/TaskStatusAutoTransition");
const AiReindexJob_1 = require("../infrastructure/jobs/AiReindexJob");
const Parcel_1 = require("../domain/entities/Parcel");
const mongoose_1 = __importDefault(require("mongoose"));
const Sentry = __importStar(require("@sentry/node"));
const instrumentation_1 = require("../instrumentation");
const redisService = new redis_1.RedisService();
let server;
let shuttingDown = false;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, dotenv_1.config)();
        yield (0, db_config_1.default)();
        yield (0, initAdmin_1.initAdmin)();
        redisService.connect();
        server = http_1.default.createServer(app_1.default);
        const io = (0, socket_config_1.default)(server);
        const clientNameSpace = io.of('/client');
        (0, socketRegistry_1.setClientNamespace)(clientNameSpace);
        (0, socketHandler_1.socketIoSetup)(clientNameSpace);
        (0, redisMessagesHandler_1.handleRedisAndSocketMessageClient)(redisService, clientNameSpace);
        const adminNameSpace = io.of('/admin');
        (0, socketRegistry_1.setAdminNamespace)(adminNameSpace);
        (0, socketHandler_1.socketIoSetup)(adminNameSpace);
        (0, redisMessagesHandler_1.handleRedisAndSocketMessageAdmin)(redisService, adminNameSpace);
        server.listen(constants_1.PORT, () => {
            console.log(`🎉 Server running on port ${constants_1.PORT}`);
            setTimeout(() => {
                void Promise.all([(0, Parcel_1.ensureParcelIndexes)(), (0, initProduct_script_1.default)()]).catch((error) => {
                    console.error('Background startup maintenance failed:', error);
                });
                (0, TrackingCronJob_1.startTrackingCronJob)(); // Auto-sync parcels every 15 min
                (0, TaskStatusAutoTransition_1.startTaskAutoTransitionJob)(); // Auto-move PACKAGING → DELIVERED after 14 days
                (0, AiReindexJob_1.startAiReindexCron)(); // Daily AI vector index refresh
            }, 30000);
        });
    });
}
const shutdown = (exitCode, reason) => __awaiter(void 0, void 0, void 0, function* () {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.log(JSON.stringify({ event: 'shutdown_started', reason, exitCode }));
    const forceExit = setTimeout(() => process.exit(exitCode), 10000);
    forceExit.unref();
    const closeServer = new Promise((resolve) => {
        if (!(server === null || server === void 0 ? void 0 : server.listening))
            return resolve();
        server.close((error) => {
            if (error) {
                console.error(JSON.stringify({ event: 'http_close_failed', message: (0, instrumentation_1.sanitizeSensitiveText)(error.message) }));
            }
            resolve();
        });
    });
    yield Promise.allSettled([
        closeServer,
        mongoose_1.default.disconnect(),
        Sentry.flush(5000),
    ]);
    clearTimeout(forceExit);
    process.exit(exitCode);
});
const handleFatal = (type, reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error(JSON.stringify({
        event: type,
        message: (0, instrumentation_1.sanitizeSensitiveText)(error.message),
        stack: error.stack ? (0, instrumentation_1.sanitizeSensitiveText)(error.stack) : undefined,
    }));
    Sentry.captureException(error, { tags: { fatal: 'true', type } });
    void shutdown(1, type);
};
process.on('uncaughtException', (error) => handleFatal('uncaughtException', error));
process.on('unhandledRejection', (reason) => handleFatal('unhandledRejection', reason));
process.on('SIGTERM', () => void shutdown(0, 'SIGTERM'));
process.on('SIGINT', () => void shutdown(0, 'SIGINT'));
main().catch((err) => {
    handleFatal('unhandledRejection', err);
});
