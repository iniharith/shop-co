/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { RedisService } from "./redis";
import { REDIS_CHANNELS } from "../../shared/constants/redis.constant";
import { DefaultEventsMap, Namespace, Server } from "socket.io";
import { getReceiverSocketId } from "../socket/socketHandler";

export function handleRedisAndSocketMessageClient(redisService: RedisService, io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    //   enum to array
    const channels = Object.values(REDIS_CHANNELS);
    channels.forEach(async (channel) => {
        await redisService.subscribe(channel);
    });

    redisService.on("message", async (channel, message) => {
        switch (channel) {
            case REDIS_CHANNELS.NOTIFICATION:
                const data = JSON.parse(message);
                const socketId = await getReceiverSocketId(data?.userId) || null;
                if (socketId) {
                    console.log("🟢 sending notification to user", data?.userId, socketId);
                    io.to(socketId).emit("notification", data);
                } else {
                    console.log("🔴 no socket id found for user", data?.userId);
                }
                break;
            case REDIS_CHANNELS.CHAT_MESSAGE:
                console.log("🟢 new chat message", message);
                io.emit("new_message", JSON.parse(message));
                break;

        }


    });
}

export function handleRedisAndSocketMessageAdmin(redisService: RedisService, io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    //   enum to array
    const channels = Object.values(REDIS_CHANNELS);
    channels.forEach(async (channel) => {
        await redisService.subscribe(channel);
    });

    redisService.on("message", async (channel, message) => {
        switch (channel) {
            case REDIS_CHANNELS.ORDER_PLACED:
                console.log("🟢 order placed", message);
                io.emit("order_placed", message);
                break;
            case REDIS_CHANNELS.NOTIFICATION:
                const dataAdmin = JSON.parse(message);
                const socketIdAdmin = await getReceiverSocketId(dataAdmin?.userId) || null;
                if (socketIdAdmin) {
                    console.log("🟢 sending notification to admin", dataAdmin?.userId, socketIdAdmin);
                    io.to(socketIdAdmin).emit("notification", dataAdmin);
                } else {
                    console.log("🔴 no socket id found for admin", dataAdmin?.userId);
                }
                break;
            case REDIS_CHANNELS.CHAT_MESSAGE:
                console.log("🟢 new chat message", message);
                io.emit("new_message", JSON.parse(message));
                break;
            case REDIS_CHANNELS.TASK_UPDATED:
                console.log("🟢 task updated", message);
                io.emit("task_updated", JSON.parse(message));
                break;
        }


    });
}

