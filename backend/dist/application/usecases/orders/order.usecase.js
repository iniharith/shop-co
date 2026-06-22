"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.OrderUsecase = void 0;
const cart_repository_1 = require("../../../infrastructure/db/repositories/cart.repository");
const order_repository_1 = require("../../../infrastructure/db/repositories/order.repository");
const product_repository_1 = require("../../../infrastructure/db/repositories/product.repository");
const user_repository_1 = require("../../../infrastructure/db/repositories/user.repository");
const notification_usecase_1 = require("../notification/notification.usecase");
const TaskRepository_1 = require("../../../infrastructure/repositories/TaskRepository");
const redis_1 = require("../../../infrastructure/redis/redis");
const redis_constant_1 = require("../../../shared/constants/redis.constant");
const whatsapp_service_1 = __importDefault(require("../../../infrastructure/whatsapp/whatsapp.service"));
class OrderUsecase {
    constructor() {
        this.orderRepository = new order_repository_1.OrderRepository();
        this.productRepository = new product_repository_1.ProductRepository();
        this.cartRepository = new cart_repository_1.CartRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationUsecase = new notification_usecase_1.NotificationUsecase();
        this.redisService = new redis_1.RedisService();
        this.taskRepository = new TaskRepository_1.TaskRepository();
    }
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOrders = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS);
            if (cachedOrders) {
                return JSON.parse(cachedOrders);
            }
            const orders = yield this.orderRepository.getOrders();
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS, JSON.stringify(orders), 60 * 60 * 24);
            return orders;
        });
    }
    getOrdersByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOrders = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS + userId);
            if (cachedOrders) {
                return JSON.parse(cachedOrders);
            }
            const orders = yield this.orderRepository.getOrdersByUserId(userId);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS + userId, JSON.stringify(orders), 60 * 60 * 24);
            return orders;
        });
    }
    getOrderById(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const cachedOrder = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
            if (cachedOrder) {
                return JSON.parse(cachedOrder);
            }
            const order = yield this.orderRepository.getOrderById(orderId);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS + orderId, JSON.stringify(order), 60 * 60 * 24);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + ((_a = order === null || order === void 0 ? void 0 : order.userId) === null || _a === void 0 ? void 0 : _a._id));
            return order;
        });
    }
    createOrder(address, userId, customerName, orderNotes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const cart = yield this.cartRepository.getCartByUserId(userId);
            if (!cart || !cart.items || !((_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length)) {
                throw new Error("Cart did'nt have products , add Some Products In Cart");
            }
            let totalAmount = 0;
            const orderItems = [];
            for (const item of cart.items) {
                const product = yield this.productRepository.findById(item.product._id.toString());
                if (!product)
                    throw new Error(`Product not found: ${item.product._id}`);
                const sizePerProdut = product.sizes.find(e => e.size == item.size);
                if (!sizePerProdut || sizePerProdut.stock <= 0)
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                const updatedProduct = yield this.productRepository.updateProductStockBySize(product._id.toString(), item.size, -item.quantity);
                const productPrice = product.price * item.quantity;
                orderItems.push({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: productPrice,
                    size: item.size,
                    artworkUrl: item.artworkUrl
                });
                totalAmount += productPrice;
            }
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + userId);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.CART + userId);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.PRODUCTS);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.CATEGORIES);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ADDRESS + userId);
            const order = yield this.orderRepository.createOrder({
                userId,
                customerName,
                orderNotes,
                address,
                paymentMethod: "COD",
                products: orderItems,
                totalAmount
            });
            yield this.notificationUsecase.createNotification({
                userId: userId,
                title: "Order Placed",
                message: "Your order has been placed successfully",
                type: "ORDER",
                orderId: order._id.toString(),
                read: false
            });
            yield this.cartRepository.clearCart(userId);
            // Auto-create Task for this order
            try {
                yield this.taskRepository.create({
                    title: `Order: ${order._id.toString().slice(-6).toUpperCase()} - ${customerName}`,
                    description: `Auto-generated task for Order ${order._id.toString()}.\nNotes: ${orderNotes}`,
                    orderId: order._id.toString(),
                    customerUsername: customerName,
                    status: 'TODO',
                });
            }
            catch (e) {
                console.error('Failed to auto-create task for order:', e);
            }
            yield this.redisService.publish(redis_constant_1.REDIS_CHANNELS.ORDER_PLACED, 'order placed');
            return order;
        });
    }
    updateOrderStatus(orderId, updateStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.updateOrder(orderId, { orderStatus: updateStatus });
            if (!order)
                throw new Error("Order not found");
            if (order.userId) {
                yield this.notificationUsecase.createNotification({
                    userId: order.userId.toString(),
                    title: "Order Status Updated",
                    message: `Your order has been ${updateStatus}`,
                    type: "ORDER",
                    orderId: order._id.toString(),
                    read: false
                });
                const user = yield this.userRepository.findById(order.userId.toString());
                if (user && user.phoneNumber) {
                    let message = `Hello ${user.name || 'Customer'}, your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) status has been updated to: *${updateStatus}*.\n\nThank you for shopping with KampungCetak!`;
                    if (updateStatus === "ARTWORK_REJECTED") {
                        message = `Hello ${user.name || 'Customer'}, unfortunately the artwork for your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) was REJECTED.\n\nPlease re-upload the correct picture/file via your dashboard.`;
                    }
                    whatsapp_service_1.default.sendMessage(user.phoneNumber, message).catch(err => console.error("WA Error:", err));
                }
            }
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
            if (order.userId) {
                yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + order.userId.toString());
            }
            // Sync Order status back to Task
            try {
                yield this.taskRepository.updateByOrderId(orderId, { status: updateStatus });
                if (updateStatus === 'DELIVERED') {
                    const { Task } = yield Promise.resolve().then(() => __importStar(require('../../../domain/entities/Task')));
                    const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../../domain/entities/FileUpload')));
                    const { v2: cloudinary } = yield Promise.resolve().then(() => __importStar(require('cloudinary')));
                    cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
                        api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
                        api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
                    });
                    const tasks = yield Task.find({ orderId });
                    for (const task of tasks) {
                        if (task.files && task.files.length > 0) {
                            for (const file of task.files) {
                                const parts = file.url.split('/');
                                const filenameWithExtension = parts[parts.length - 1];
                                const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
                                yield cloudinary.uploader.destroy(publicId).catch(() => { });
                                yield FileUpload.findOneAndDelete({ path: file.url, taskId: task._id });
                            }
                            task.files = [];
                            yield task.save();
                        }
                    }
                }
            }
            catch (e) {
                console.error('Failed to sync order status to task:', e);
            }
            return order;
        });
    }
    getOrdersByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOrders = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS + status);
            if (cachedOrders) {
                return JSON.parse(cachedOrders);
            }
            const orders = yield this.orderRepository.getOrderByStatus(status);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS + status, JSON.stringify(orders), 60 * 60 * 24);
            return orders;
        });
    }
    getDistintAddress(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedAddress = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ADDRESS + userId);
            if (cachedAddress) {
                return JSON.parse(cachedAddress);
            }
            const address = yield this.orderRepository.getDistintValues(userId, "address");
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ADDRESS + userId, JSON.stringify(address), 60 * 60 * 24);
            return address;
        });
    }
}
exports.OrderUsecase = OrderUsecase;
