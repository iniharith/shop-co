"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_CHANNELS = exports.REDIS_KEYS = void 0;
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
})(REDIS_CHANNELS || (exports.REDIS_CHANNELS = REDIS_CHANNELS = {}));
