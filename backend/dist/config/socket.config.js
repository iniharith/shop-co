"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const connectSocket = (server) => {
    return new socket_io_1.Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        },
        connectTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 10000
    });
};
exports.default = connectSocket;
