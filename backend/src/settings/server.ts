/**
 * Coded by Harith
 * Kampungcetak ®
 */
import '../instrumentation';
import app from './app';
import connectDB from '../config/db.config';
import { PORT } from '../shared/constants';
import { config } from 'dotenv';
import initProduct from '../shared/scripts/initProduct.script';
import { initAdmin } from '../shared/scripts/initAdmin';
import http from 'http';
import productRouter from "../presentation/routes/product.route";
import connectSocket from '../config/socket.config';
import { RedisService } from '../infrastructure/redis/redis';
import { REDIS_CHANNELS } from '../shared/constants/redis.constant';
import { handleRedisAndSocketMessageAdmin, handleRedisAndSocketMessageClient } from '../infrastructure/redis/redisMessagesHandler';
import { socketIoSetup } from '../infrastructure/socket/socketHandler';
import { setAdminNamespace, setClientNamespace } from '../infrastructure/socket/socketRegistry';
import { startTrackingCronJob } from '../infrastructure/jobs/TrackingCronJob';
import { startTaskAutoTransitionJob } from '../infrastructure/jobs/TaskStatusAutoTransition';
import { ensureParcelIndexes } from '../domain/entities/Parcel';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';
import { sanitizeSensitiveText } from '../instrumentation';

const redisService = new RedisService();
let server: http.Server | undefined;
let shuttingDown = false;

async function main() {

    config();

    await connectDB();
    await initAdmin();
    redisService.connect();
    server = http.createServer(app);
    const io = connectSocket(server);
    const clientNameSpace = io.of('/client');
    setClientNamespace(clientNameSpace);
    socketIoSetup(clientNameSpace);
    handleRedisAndSocketMessageClient(redisService, clientNameSpace);

    const adminNameSpace = io.of('/admin');
    setAdminNamespace(adminNameSpace);
    socketIoSetup(adminNameSpace);
    handleRedisAndSocketMessageAdmin(redisService, adminNameSpace);

    server.listen(PORT, () => {
        console.log(`🎉 Server running on port ${PORT}`);
        setTimeout(() => {
            void Promise.all([ensureParcelIndexes(), initProduct()]).catch((error) => {
                console.error('Background startup maintenance failed:', error);
            });
            startTrackingCronJob(); // Auto-sync parcels every 15 min
            startTaskAutoTransitionJob(); // Auto-move PACKAGING → DELIVERED after 14 days
        }, 30_000);
    });
}

const shutdown = async (exitCode: number, reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(JSON.stringify({ event: 'shutdown_started', reason, exitCode }));
    const forceExit = setTimeout(() => process.exit(exitCode), 10_000);
    forceExit.unref();

    const closeServer = new Promise<void>((resolve) => {
        if (!server?.listening) return resolve();
        server.close((error) => {
            if (error) {
                console.error(JSON.stringify({ event: 'http_close_failed', message: sanitizeSensitiveText(error.message) }));
            }
            resolve();
        });
    });

    await Promise.allSettled([
        closeServer,
        mongoose.disconnect(),
        Sentry.flush(5_000),
    ]);
    clearTimeout(forceExit);
    process.exit(exitCode);
};

const handleFatal = (type: 'uncaughtException' | 'unhandledRejection', reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error(JSON.stringify({
        event: type,
        message: sanitizeSensitiveText(error.message),
        stack: error.stack ? sanitizeSensitiveText(error.stack) : undefined,
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
