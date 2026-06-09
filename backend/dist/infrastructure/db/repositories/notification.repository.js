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
exports.NotificationRepository = void 0;
const notification_model_1 = require("../models/notification.model");
const base_repository_1 = require("./base.repository");
class NotificationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(notification_model_1.NotificationModel);
    }
    createNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.create(notification);
        });
    }
    getNotificationsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.find({ userId }).sort({ createdAt: -1 });
        });
    }
    markAllNotificationsAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.updateMany({ userId }, { $set: { read: true } });
        });
    }
}
exports.NotificationRepository = NotificationRepository;
