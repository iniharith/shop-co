"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const socket_io_1 = require("socket.io");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const connectSocket = (server) => {
    return new socket_io_1.Server(server, {
        cors: {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true
        },
        connectTimeout: 20000,
        pingTimeout: 20000,
        pingInterval: 25000
    });
};
exports.default = connectSocket;
