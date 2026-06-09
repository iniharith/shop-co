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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsecase = void 0;
const user_repository_1 = require("../../../infrastructure/db/repositories/user.repository");
const jwt_1 = __importDefault(require("../../../shared/utils/jwt"));
const order_repository_1 = require("../../../infrastructure/db/repositories/order.repository");
const notification_repository_1 = require("../../../infrastructure/db/repositories/notification.repository");
const notification_usecase_1 = require("../notification/notification.usecase");
class AdminUsecase {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.jwtService = new jwt_1.default();
        this.orderRepository = new order_repository_1.OrderRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.notificationUsecase = new notification_usecase_1.NotificationUsecase();
    }
    getUsersByRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.getUsersByRole(role);
        });
    }
    verifyUser(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            user.verified = status;
            // WIREUP: socket io to send notification to the user
            yield this.notificationUsecase.createNotification({
                userId: user._id.toString(),
                title: "User Verified",
                message: "Your account has been verified",
                type: "VERIFICATION",
                read: false
            });
            return yield this.userRepository.updateById(userId, user);
        });
    }
    adminLogin(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (email !== adminEmail || password !== adminPassword) {
                throw new Error("Invalid email or password");
            }
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("User not found");
            }
            const accessToken = this.jwtService.generateAccessToken({ userId: user._id });
            const refreshToken = this.jwtService.generateRefreshToken({ userId: user._id });
            return { user, accessToken, refreshToken };
        });
    }
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderRepository.getOrders();
        });
    }
    getOrdersByDeliveryBoy(deliveryBoyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderRepository.getOderByDeliveryBoy(deliveryBoyId);
        });
    }
}
exports.AdminUsecase = AdminUsecase;
exports.default = new AdminUsecase();
