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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AdminUsecase {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.jwtService = new jwt_1.default();
        this.orderRepository = new order_repository_1.OrderRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.notificationUsecase = new notification_usecase_1.NotificationUsecase();
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findAll();
        });
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
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = data.password
                ? yield bcryptjs_1.default.hash(data.password, 10)
                : yield bcryptjs_1.default.hash(Math.random().toString(36).slice(-8), 10);
            return yield user_model_1.default.create(Object.assign(Object.assign({}, data), { password }));
        });
    }
    updateUser(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.password) {
                data.password = yield bcryptjs_1.default.hash(data.password, 10);
            }
            return yield user_model_1.default.findByIdAndUpdate(userId, data, { new: true });
        });
    }
    createManualOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield order_model_1.default.create(data);
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
    seedTestData() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create 3 dummy customers
            const customers = [];
            for (let i = 1; i <= 3; i++) {
                let u = yield user_model_1.default.findOne({ email: `customer${i}@test.com` });
                if (!u) {
                    u = yield user_model_1.default.create({
                        name: `Test Customer ${i}`,
                        email: `customer${i}@test.com`,
                        password: "password123",
                        role: user_type_1.Roles.CLIENT,
                        verified: true
                    });
                }
                customers.push(u);
            }
            // Create dummy orders for these customers
            for (const customer of customers) {
                const order = yield order_model_1.default.create({
                    userId: customer._id,
                    products: [], // empty or add dummy products if needed
                    totalAmount: Math.floor(Math.random() * 500) + 50,
                    paymentMethod: "ONLINE",
                    paymentStatus: "PAID",
                    orderStatus: "PLACED",
                    address: {
                        address: "123 Jalan Test",
                        street: "Test Street",
                        city: "Kuala Lumpur",
                        postalCode: "50000",
                        country: "Malaysia"
                    }
                });
                yield Parcel_1.Parcel.create({
                    orderId: order._id.toString(),
                    trackingNumber: `TRACK-${Math.floor(Math.random() * 100000)}`,
                    customerPhone: "60123456789",
                    customerName: customer.name,
                    customerEmail: customer.email,
                    courier: "J&T Express",
                    status: "in_transit",
                    lastStatus: "picked_up",
                    events: [
                        {
                            status: "picked_up",
                            description: "Parcel picked up by courier",
                            location: "Kuala Lumpur Hub",
                            timestamp: new Date(Date.now() - 86400000)
                        },
                        {
                            status: "in_transit",
                            description: "Parcel arrived at sorting center",
                            location: "Selangor Hub",
                            timestamp: new Date()
                        }
                    ],
                    weight: 1.5,
                });
                // Create some file uploads for this customer
                yield FileUpload_1.FileUpload.create({
                    userId: customer._id.toString(),
                    filename: `test-artwork-${customer._id}.jpg`,
                    originalName: `Design_${customer.name}.jpg`,
                    mimetype: "image/jpeg",
                    size: 2048000,
                    path: "https://via.placeholder.com/500", // dummy URL
                    adminReviewed: false
                });
            }
        });
    }
}
exports.AdminUsecase = AdminUsecase;
exports.default = new AdminUsecase();
