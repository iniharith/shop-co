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
exports.OrderUsecase = void 0;
const cart_repository_1 = require("../../../infrastructure/db/repositories/cart.repository");
const order_repository_1 = require("../../../infrastructure/db/repositories/order.repository");
const product_repository_1 = require("../../../infrastructure/db/repositories/product.repository");
const user_repository_1 = require("../../../infrastructure/db/repositories/user.repository");
const notification_usecase_1 = require("../notification/notification.usecase");
const redis_1 = require("../../../infrastructure/redis/redis");
const redis_constant_1 = require("../../../shared/constants/redis.constant");
class OrderUsecase {
    constructor() {
        this.orderRepository = new order_repository_1.OrderRepository();
        this.productRepository = new product_repository_1.ProductRepository();
        this.cartRepository = new cart_repository_1.CartRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationUsecase = new notification_usecase_1.NotificationUsecase();
        this.redisService = new redis_1.RedisService();
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
            yield this.redisService.publish(redis_constant_1.REDIS_CHANNELS.ORDER_PLACED, 'order placed');
            return order;
        });
    }
    updateOrderStatus(orderId, updateStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const order = yield this.orderRepository.updateOrder(orderId, { orderStatus: updateStatus });
            if (!order)
                throw new Error("Order not found");
            yield this.notificationUsecase.createNotification({
                userId: (_a = order === null || order === void 0 ? void 0 : order.userId) === null || _a === void 0 ? void 0 : _a.toString(),
                title: "Order Status Updated",
                message: `Your order has been ${updateStatus}`,
                type: "ORDER",
                orderId: order === null || order === void 0 ? void 0 : order._id.toString(),
                read: false
            });
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
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
    getOrdersByDeliveryBoy(deliveryBoy) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(deliveryBoy);
            if (!user)
                throw new Error("Delivery Boy not found");
            const cachedOrders = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS + deliveryBoy);
            if (cachedOrders) {
                return JSON.parse(cachedOrders);
            }
            const orders = yield this.orderRepository.getOderByDeliveryBoy(deliveryBoy);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS + deliveryBoy, JSON.stringify(orders), 60 * 60 * 24);
            return orders;
        });
    }
    getOrdersByDeliveryBoyAndStatus(deliveryBoy, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOrders = yield this.redisService.get(redis_constant_1.REDIS_KEYS.ORDERS + deliveryBoy + status);
            if (cachedOrders) {
                return JSON.parse(cachedOrders);
            }
            const orders = yield this.orderRepository.getOderByDeliveryBoyAndStatus(deliveryBoy, status);
            yield this.redisService.set(redis_constant_1.REDIS_KEYS.ORDERS + deliveryBoy + status, JSON.stringify(orders), 60 * 60 * 24);
            return orders;
        });
    }
    addDeliveryBoyToOrder(orderId, deliveryBoy) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const user = yield this.userRepository.findById(deliveryBoy);
            if (!user)
                throw new Error("Delivery Boy not found");
            const order = yield this.orderRepository.updateOrder(orderId, { deliveryBoy: user._id });
            if (!order)
                throw new Error("Order not found");
            yield this.notificationUsecase.createNotification({
                userId: user._id.toString(),
                title: "Order Assigned to You",
                message: "You have been assigned to this order",
                type: "DELIVERY",
                orderId: order._id.toString(),
                read: false
            });
            yield this.notificationUsecase.createNotification({
                userId: (_a = order === null || order === void 0 ? void 0 : order.userId) === null || _a === void 0 ? void 0 : _a.toString(),
                title: "Order Assigned to " + user.name,
                message: "Your order has been assigned to " + user.name,
                type: "DELIVERY",
                orderId: order._id.toString(),
                read: false
            });
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + ((_b = order === null || order === void 0 ? void 0 : order.userId) === null || _b === void 0 ? void 0 : _b._id));
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + deliveryBoy);
            return order;
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
