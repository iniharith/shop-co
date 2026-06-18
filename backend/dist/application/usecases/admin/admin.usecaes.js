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
const user_type_1 = require("../../../domain/types/user.type");
const order_repository_1 = require("../../../infrastructure/db/repositories/order.repository");
const notification_repository_1 = require("../../../infrastructure/db/repositories/notification.repository");
const notification_usecase_1 = require("../notification/notification.usecase");
const user_model_1 = __importDefault(require("../../../infrastructure/db/models/user.model"));
const order_model_1 = __importDefault(require("../../../infrastructure/db/models/order.model"));
const FileUpload_1 = require("../../../domain/entities/FileUpload");
const Parcel_1 = require("../../../domain/entities/Parcel");
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
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            yield this.userRepository.deleteById(userId);
        });
    }
    adminLogin(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (email !== adminEmail || password !== adminPassword) {
                throw new Error("Invalid email or password");
            }
            let user = yield this.userRepository.findByEmail(email);
            if (!user) {
                // Auto-create admin user on first login
                user = yield this.userRepository.create({
                    name: "Super Admin",
                    email: email,
                    password: password, // will be hashed by mongoose hook
                    role: user_type_1.Roles.ADMIN,
                    verified: true,
                    phone: "0000000000"
                });
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
    seedTestData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new Error("Admin User ID is required to generate Test Drive data");
            }
            const adminUser = yield user_model_1.default.findById(userId);
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // 1. Create a highly realistic Test Order
            const testOrder = yield order_model_1.default.create({
                userId: adminUser._id,
                products: [{
                        productId: "demo-product-123",
                        name: "Premium Business Cards",
                        quantity: 500,
                        price: 150
                    }],
                totalAmount: 150,
                paymentMethod: "ONLINE",
                paymentStatus: "PAID",
                orderStatus: "PLACED",
                address: {
                    address: "Test Drive Ave, Suite 100",
                    street: "Demo Street",
                    city: "Kuala Lumpur",
                    postalCode: "50000",
                    country: "Malaysia"
                }
            });
            // 2. Fire Real-time Notification for Artwork
            yield this.notificationUsecase.createNotification({
                userId: adminUser._id.toString(),
                title: "Action Required: Upload Artwork",
                message: `Please upload your design artwork for Test Order #${testOrder._id.toString().substring(0, 8).toUpperCase()}.`,
                type: "ORDER",
                orderId: testOrder._id.toString(),
                read: false
            });
            // 3. Create a Dummy Parcel Tracking Record
            const trackingNumber = `TRK-TEST-${Math.floor(Math.random() * 90000) + 10000}`;
            yield Parcel_1.Parcel.create({
                orderId: testOrder._id.toString(),
                trackingNumber: trackingNumber,
                customerPhone: adminUser.phoneNumber || "60123456789",
                customerName: adminUser.name,
                customerEmail: adminUser.email,
                courier: "J&T Express",
                status: "in_transit",
                lastStatus: "picked_up",
                events: [{
                        status: "picked_up",
                        description: "Parcel picked up by courier",
                        location: "Selangor Hub",
                        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
                    }, {
                        status: "in_transit",
                        description: "Parcel is in transit to destination facility",
                        location: "Kuala Lumpur Hub",
                        timestamp: new Date()
                    }],
                weight: 1.5,
                senderName: "Kampung Cetak (Demo)",
                senderPhone: "6031234567",
                senderAddress: "HQ Print Shop",
                recipientAddress: "Test Drive Ave, Suite 100",
            });
            // 4. Fire Real-time Notification for Tracking
            yield this.notificationUsecase.createNotification({
                userId: adminUser._id.toString(),
                title: "Order Shipped!",
                message: `Your Test Order #${testOrder._id.toString().substring(0, 8).toUpperCase()} is now in transit. Tracking: ${trackingNumber}`,
                type: "DELIVERY",
                orderId: testOrder._id.toString(),
                read: false
            });
            // Optional: Create a dummy FileUpload to simulate an already uploaded file for UI testing
            yield FileUpload_1.FileUpload.create({
                userId: adminUser._id.toString(),
                orderId: testOrder._id.toString(),
                filename: `demo-artwork-${testOrder._id}.pdf`,
                originalName: `BusinessCard_Demo.pdf`,
                mimetype: "application/pdf",
                size: 4500000,
                path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                adminReviewed: false
            });
        });
    }
}
exports.AdminUsecase = AdminUsecase;
exports.default = new AdminUsecase();
