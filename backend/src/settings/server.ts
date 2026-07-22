/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
import { startTrackingCronJob } from '../infrastructure/jobs/TrackingCronJob';
import { startTaskAutoTransitionJob } from '../infrastructure/jobs/TaskStatusAutoTransition';
import { ensureParcelIndexes } from '../domain/entities/Parcel';

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT Exception! Ignoring ...");
    console.error(err);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Ignoring ...");
    console.error(err);
    // Don't exit - keep server running
});

const redisService = new RedisService();

async function main() {

    config();

    await connectDB();
    await initAdmin();
    redisService.connect();
    const server = http.createServer(app);
    const io = connectSocket(server);
    const clientNameSpace = io.of('/client');
    socketIoSetup(clientNameSpace);
    handleRedisAndSocketMessageClient(redisService, clientNameSpace);

    const adminNameSpace = io.of('/admin');
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
