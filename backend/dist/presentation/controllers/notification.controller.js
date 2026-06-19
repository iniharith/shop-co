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
exports.NotificationController = void 0;
const notification_usecase_1 = require("../../application/usecases/notification/notification.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
/** @Controller */
class NotificationController {
    constructor() {
        this.notificationUsecase = new notification_usecase_1.NotificationUsecase();
    }
    /**
     * @description Get notifications
     * @Method GET
     * @Access PRIVATE
     * @Route /api/notifications
     * @Response 200 - Notifications fetched successfully
     * @Response 400 - User id is required
     * @Response 500 - Internal server error
     */
    getNotifications(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield this.notificationUsecase.getNotifications(req.userId);
                return res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "Notifications fetched successfully",
                    notifications: notifications || []
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Mark notification all as read
     * @Method PUT
     * @Access PRIVATE
     * @Route /api/notifications/read
     * @Response 200 - Notification marked as read successfully
     * @Response 400 - User id is required
     */
    markAllNotificationsAsRead(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.notificationUsecase.markAllNotificationsAsRead(req.userId);
                return res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "Notification marked as read successfully",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.NotificationController = NotificationController;
