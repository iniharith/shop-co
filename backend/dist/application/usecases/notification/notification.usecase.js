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
exports.NotificationUsecase = void 0;
const notification_repository_1 = require("../../../infrastructure/db/repositories/notification.repository");
const redis_1 = require("../../../infrastructure/redis/redis");
const redis_constant_1 = require("../../../shared/constants/redis.constant");
class NotificationUsecase {
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.redisService = new redis_1.RedisService();
    }
    getNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationRepository.getNotificationsByUserId(userId);
        });
    }
    createNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.redisService.publish(redis_constant_1.REDIS_CHANNELS.NOTIFICATION, JSON.stringify(notification));
            const data = yield this.notificationRepository.createNotification(notification);
            return data;
        });
    }
    markAllNotificationsAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationRepository.markAllNotificationsAsRead(userId);
        });
    }
}
exports.NotificationUsecase = NotificationUsecase;
