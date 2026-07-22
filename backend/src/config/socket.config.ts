/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Server } from "socket.io"
import http from "http";
import { config } from "dotenv";
config()

const connectSocket = (server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) => {
    return new Server(server, {
        cors: {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true
        },
        connectTimeout: 20000,
        pingTimeout: 20000,
        pingInterval: 25000
    })
}

export default connectSocket;
