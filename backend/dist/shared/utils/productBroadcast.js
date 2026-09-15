"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitProductUpdated = void 0;
const redis_constant_1 = require("../constants/redis.constant");
const redis_1 = require("../../infrastructure/redis/redis");
const socketRegistry_1 = require("../../infrastructure/socket/socketRegistry");
const redisService = new redis_1.RedisService();
const emitProductUpdated = (product_1, ...args_1) => __awaiter(void 0, [product_1, ...args_1], void 0, function* (product, action = 'updated') {
    const message = {
        action,
        product,
        productId: (product === null || product === void 0 ? void 0 : product._id) ? String(product._id) : undefined,
        slug: (product === null || product === void 0 ? void 0 : product.slug) ? String(product.slug) : undefined,
    };
    for (const namespace of [(0, socketRegistry_1.getClientNamespace)(), (0, socketRegistry_1.getAdminNamespace)()]) {
        if (!namespace)
            continue;
        try {
            namespace.emit('product_updated', message);
        }
        catch (error) {
            console.error('Failed to emit product socket event locally:', error);
        }
    }
    try {
        yield redisService.publish(redis_constant_1.REDIS_CHANNELS.PRODUCT_UPDATED, JSON.stringify(message));
    }
    catch (error) {
        console.error('Failed to publish product socket event:', error);
    }
});
exports.emitProductUpdated = emitProductUpdated;
