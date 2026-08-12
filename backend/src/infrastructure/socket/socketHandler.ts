/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { UserRepository } from "../db/repositories/user.repository";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Namespace } from "socket.io";
import JwtService from "../../shared/utils/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { RedisService } from "../redis/redis";
import { REDIS_CHANNELS } from "../../shared/constants/redis.constant";


const userSocketMap = new Map<string, string>()

export const socketIoSetup = async (io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    const userRepository = new UserRepository();
    const redisService = new RedisService();
    const adminRoles = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];

    if (io.name === '/admin') {
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token;
                if (!token) return next(new Error('Unauthorized'));

                const { userId } = new JwtService().verifyAccessToken(token) as JwtPayload;
                if (!userId) return next(new Error('Unauthorized'));

                const user = await userRepository.findById(userId as string);
                if (!user || !adminRoles.includes(user.role)) {
                    return next(new Error('Unauthorized'));
                }

                socket.data.userId = userId.toString();
                socket.data.user = user;
                next();
            } catch {
                next(new Error('Unauthorized'));
            }
        });
    }

    // listen when client is connected to socket
    io.on("connection", async (socket) => {
        const userId = socket.data.userId || socket.handshake.query["userId"];

        console.log("🟡 user conneted to socket from id:", socket.id, userId);

        if (userId && userId !== null && !!userId) {
            try {
                const user = socket.data.user || await userRepository.findById(userId as string);
                if (user) {
                    // socket.join(userId as string)
                    userSocketMap.set(userId as string, socket.id)
                    io.to(socket.id).emit("joined", {
                        message: `🔵 user:${user?.name} joined room `
                    })
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
                        socket.on('task_typing', async (payload: any) => {
                            try {
                                const message = {
                                    ...(payload || {}),
                                    userId,
                                    userName: user?.name || user?.email || 'Someone',
                                };
                                await redisService.publish(REDIS_CHANNELS.TASK_TYPING, JSON.stringify(message));
                            } catch (e) {
                                console.error('Failed to relay task_typing:', e);
                            }
                        });
                    }
                    socket.on('disconnect', () => {
                        if (realtimeStatusInterval) clearInterval(realtimeStatusInterval);
                        if (userSocketMap.get(userId as string) === socket.id) {
                            userSocketMap.delete(userId as string);
                        }
                    });
                } else {
                    userSocketMap.delete(userId as string)
                    console.log("🔴 user is not found");
                    socket.disconnect();
                }



            } catch (error) {
                console.log("🔴 error on while updateing user", (error as Error).message)

            }
        } else console.log("🔴 user id is not found ");

    });

}

export const getReceiverSocketId = (userId: string) => {
    const getd = userSocketMap.get(userId)
    console.log("🟡 getReceiverSocketId", getd, userSocketMap)
    return getd
}

export const getOnlineUsersCount = () => {
    return userSocketMap.size;
}
