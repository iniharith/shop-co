"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_CHANNELS = exports.REDIS_KEYS = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
exports.REDIS_KEYS = {
    PRODUCTS: "products",
    CATEGORIES: "categories",
    USERS: "users",
    ORDERS: "orders",
    CART: "cart",
    ADDRESS: "address",
    SOCKET: "socket",
};
var REDIS_CHANNELS;
(function (REDIS_CHANNELS) {
    REDIS_CHANNELS["NOTIFICATION"] = "notification";
    REDIS_CHANNELS["ORDER_PLACED"] = "order_placed";
    REDIS_CHANNELS["CHAT_MESSAGE"] = "chat_message";
    REDIS_CHANNELS["CHAT_TYPING"] = "chat_typing";
    REDIS_CHANNELS["FILES_UPDATED"] = "files_updated";
    REDIS_CHANNELS["TASK_UPDATED"] = "task_updated";
    REDIS_CHANNELS["TASK_TYPING"] = "task_typing";
})(REDIS_CHANNELS || (exports.REDIS_CHANNELS = REDIS_CHANNELS = {}));
