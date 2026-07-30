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
const EasyParcelService_1 = require("../../../infrastructure/services/EasyParcelService");
const EasyParcelUtils_1 = require("../../../infrastructure/services/EasyParcelUtils");
const taskBroadcast_1 = require("../../../shared/utils/taskBroadcast");
const FileUploadRepository_1 = require("../../../infrastructure/repositories/FileUploadRepository");
const order_model_1 = __importDefault(require("../../../infrastructure/db/models/order.model"));
const ParcelRepository_1 = require("../../../infrastructure/repositories/ParcelRepository");
const CustomerUpdateSettingsService_1 = require("../../../infrastructure/services/CustomerUpdateSettingsService");
const EasyParcelTrackingSyncService_1 = require("../../../infrastructure/services/EasyParcelTrackingSyncService");
const fileUploadRoutes_1 = require("../../../presentation/routes/fileUploadRoutes");
function requiredSenderEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value)
        throw new Error(`EasyParcel sender configuration is missing ${name}`);
    return value;
}
function validateDimensions(input) {
    for (const key of ['weight', 'width', 'length', 'height']) {
        if (!Number.isFinite(input[key]) || input[key] <= 0)
            throw new Error(`${key} must be a positive number`);
    }
}
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
                const task = yield this.taskRepository.create({
                    title: `Order: ${order._id.toString().slice(-6).toUpperCase()} - ${customerName}`,
                    description: `Auto-generated task for Order ${order._id.toString()}.\nNotes: ${orderNotes}`,
                    orderId: order._id.toString(),
                    customerUsername: customerName,
                    status: 'PLACED',
                });
                void (0, taskBroadcast_1.emitTaskUpdated)('task_created', { task });
            }
            catch (e) {
                console.error('Failed to auto-create task for order:', e);
            }
            yield this.redisService.publish(redis_constant_1.REDIS_CHANNELS.ORDER_PLACED, 'order placed');
            return order;
        });
    }
    updateOrderStatus(orderId_1, updateStatus_1) {
        return __awaiter(this, arguments, void 0, function* (orderId, updateStatus, syncTasks = true, sourceTaskId) {
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
                if (user && user.phoneNumber && (yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)())) {
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
            // Clear folder-group cache so Production/Packaging pages see updated status immediately
            yield (0, fileUploadRoutes_1.clearFolderGroupCache)().catch(() => { });
            // Sync Order status back to Task
            try {
                if (syncTasks) {
                    yield this.taskRepository.updateByOrderId(orderId, {
                        status: updateStatus,
                        statusUpdatedAt: new Date(),
                    });
                }
                if (updateStatus === 'DELIVERED') {
                    const { Task } = yield Promise.resolve().then(() => __importStar(require('../../../domain/entities/Task')));
                    const { FileUpload } = yield Promise.resolve().then(() => __importStar(require('../../../domain/entities/FileUpload')));
                    const { deleteFromS3 } = yield Promise.resolve().then(() => __importStar(require('../../../infrastructure/config/s3')));
                    const tasks = syncTasks
                        ? yield Task.find({ orderId })
                        : sourceTaskId
                            ? yield Task.find({ _id: sourceTaskId })
                            : [];
                    for (const task of tasks) {
                        const fileUploads = yield FileUpload.find({ taskId: task._id.toString() });
                        const fileUrls = new Set([
                            ...(task.files || []).map(file => file.url),
                            ...fileUploads.map(file => file.path),
                        ].filter(Boolean));
                        for (const fileUrl of fileUrls) {
                            yield deleteFromS3(fileUrl).catch(() => { });
                        }
                        yield FileUpload.deleteMany({ taskId: task._id.toString() });
                        task.files = [];
                        yield task.save();
                    }
                    void (0, FileUploadRepository_1.notifyFileClients)();
                }
                if (syncTasks) {
                    const updatedTasks = yield this.taskRepository.findByOrderId(orderId);
                    updatedTasks.forEach(task => void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task }));
                }
            }
            catch (e) {
                console.error('Failed to sync order status to task:', e);
            }
            return order;
        });
    }
    toggleArchiveStatus(orderId, isArchived) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.updateOrder(orderId, { isArchived });
            if (!order)
                throw new Error("Order not found");
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + orderId);
            if (order.userId) {
                yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + order.userId.toString());
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
    getShippingQuotations(orderId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            validateDimensions(input);
            const order = yield this.getShippableOrder(orderId);
            return EasyParcelService_1.easyParcelService.getQuotations([this.buildShipment(order, input)]);
        });
    }
    createShipment(orderId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            validateDimensions(input);
            if (!((_a = input.serviceId) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error('serviceId is required');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(input.collectionDate || '')) {
                throw new Error('collectionDate must use YYYY-MM-DD');
            }
            const order = yield this.getShippableOrder(orderId);
            if (order.easyparcelShipmentId || order.easyparcelAwb)
                throw new Error('Shipment already created for this order');
            const shipment = this.buildShipment(order, input);
            const locked = yield order_model_1.default.findOneAndUpdate({
                _id: orderId,
                paymentStatus: 'PAID',
                orderStatus: { $in: ['DONE_PRINTING', 'PACKAGING'] },
                easyparcelShipmentId: { $exists: false },
                $or: [
                    { easyparcelBookingStatus: { $exists: false } },
                    { easyparcelBookingStatus: 'failed' },
                ],
            }, {
                $set: {
                    easyparcelBookingStatus: 'submitted',
                    easyparcelServiceId: input.serviceId.trim(),
                    shippingWeight: input.weight,
                    shippingDimensions: { width: input.width, length: input.length, height: input.height },
                    shippingCollectionDate: new Date(`${input.collectionDate}T00:00:00.000Z`),
                    shippingCustomerPhone: shipment.receiver.phone.number,
                    shippingCustomerEmail: shipment.receiver.email,
                }
            }, { new: true });
            if (!locked)
                throw new Error('Shipment is already being submitted or the order is no longer shippable');
            let result;
            try {
                result = yield EasyParcelService_1.easyParcelService.submitOrder(Object.assign(Object.assign({}, shipment), { serviceId: input.serviceId.trim(), collectionDate: input.collectionDate, reference: orderId, itemDescription: 'Printed Products', itemValue: order.totalAmount, currency: 'MYR' }));
            }
            catch (error) {
                const definitelyRejected = error instanceof EasyParcelService_1.EasyParcelApiError && !error.ambiguous;
                yield order_model_1.default.findByIdAndUpdate(orderId, {
                    $set: { easyparcelBookingStatus: definitelyRejected ? 'failed' : 'submitted' }
                });
                if (!definitelyRejected) {
                    throw new Error('EasyParcel submission result is uncertain. Reconcile the shipment before retrying to avoid a duplicate charge.');
                }
                throw error;
            }
            const bookingStatus = result.awbNumber ? 'booked' : 'awb_pending';
            let updatedOrder = null;
            try {
                const orderUpdate = {
                    easyparcelOrderNo: result.orderNumber,
                    easyparcelShipmentId: result.shipmentNumber,
                    easyparcelBookingStatus: bookingStatus,
                    easyparcelAwb: result.awbNumber || '',
                    trackingNumber: result.awbNumber || '',
                    awbUrl: result.awbUrl,
                    awbUrlsByFormat: result.awbUrlsByFormat,
                    trackingUrl: result.trackingUrl,
                    courier: result.courier,
                    shippingPrice: result.shippingPrice,
                };
                updatedOrder = yield this.orderRepository.updateOrder(orderId, orderUpdate);
                const sender = this.buildSender();
                const receiver = this.buildReceiver(order, input);
                yield ParcelRepository_1.parcelRepository.upsertByOrderId(orderId, {
                    trackingNumber: result.awbNumber || undefined,
                    easyparcelOrderNumber: result.orderNumber,
                    easyparcelShipmentId: result.shipmentNumber,
                    serviceId: input.serviceId,
                    courier: result.courier || 'unknown',
                    service: result.service,
                    awbUrl: result.awbUrl,
                    awbUrlsByFormat: result.awbUrlsByFormat,
                    trackingUrl: result.trackingUrl,
                    bookingStatus,
                    collectionDate: new Date(`${input.collectionDate}T00:00:00.000Z`),
                    shippingPrice: result.shippingPrice,
                    currency: result.currency || 'MYR',
                    dimensions: { width: input.width, length: input.length, height: input.height },
                    weight: input.weight,
                    customerName: order.customerName,
                    customerPhone: receiver.phone.number,
                    customerEmail: receiver.email,
                    senderName: sender.name,
                    senderPhone: sender.phone.number,
                    senderAddress: [sender.address1, sender.address2].filter(Boolean).join(', '),
                    recipientAddress: [receiver.address1, receiver.address2].filter(Boolean).join(', '),
                    status: 'pending',
                    lastStatus: '',
                });
            }
            catch (error) {
                console.error('EasyParcel shipment booked but local persistence failed:', error);
                yield order_model_1.default.findByIdAndUpdate(orderId, {
                    $set: {
                        easyparcelOrderNo: result.orderNumber,
                        easyparcelShipmentId: result.shipmentNumber,
                        easyparcelBookingStatus: 'submitted',
                        easyparcelAwb: result.awbNumber || '',
                        trackingNumber: result.awbNumber || '',
                        awbUrl: result.awbUrl,
                        awbUrlsByFormat: result.awbUrlsByFormat,
                        trackingUrl: result.trackingUrl,
                        courier: result.courier,
                    },
                }).catch(() => undefined);
                throw new Error(`EasyParcel booked shipment ${result.shipmentNumber}, but local tracking sync needs repair. Use Reconcile and do not create another shipment.`);
            }
            yield this.invalidateOrderCaches(order).catch((error) => console.error('Failed to invalidate order caches:', error));
            return updatedOrder;
        });
    }
    refreshShipping(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.getOrderById(orderId);
            if (!order)
                throw new Error('Order not found');
            if (!order.easyparcelShipmentId)
                throw new Error('No EasyParcel shipment exists for this order');
            const existingParcel = yield ParcelRepository_1.parcelRepository.findByShipmentId(order.easyparcelShipmentId);
            if (!existingParcel)
                return this.reconcileSubmittedShipment(orderId, order.easyparcelShipmentId);
            const requestedAt = new Date();
            const shipment = yield EasyParcelService_1.easyParcelService.getShipmentDetails(order.easyparcelShipmentId);
            const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
            const update = {
                easyparcelBookingStatus: bookingStatus,
                easyparcelAwb: shipment.awbNumber || '',
                trackingNumber: shipment.awbNumber || '',
                awbUrl: shipment.awbUrl,
                awbUrlsByFormat: shipment.awbUrlsByFormat,
                trackingUrl: shipment.trackingUrl,
                courier: shipment.courier,
            };
            yield this.orderRepository.updateOrder(orderId, update);
            if (existingParcel) {
                yield ParcelRepository_1.parcelRepository.update(existingParcel._id.toString(), {
                    trackingNumber: shipment.awbNumber || undefined,
                    bookingStatus,
                    awbUrl: shipment.awbUrl,
                    awbUrlsByFormat: shipment.awbUrlsByFormat,
                    trackingUrl: shipment.trackingUrl,
                    courier: shipment.courier || existingParcel.courier,
                    service: shipment.service,
                });
            }
            if (shipment.statusCode !== undefined) {
                const applied = yield ParcelRepository_1.parcelRepository.updateProviderStatus(existingParcel._id.toString(), requestedAt, {
                    shipmentStatusCode: shipment.statusCode,
                    status: (0, EasyParcelService_1.mapEasyParcelStatus)(shipment.statusCode),
                });
                const current = applied || (yield ParcelRepository_1.parcelRepository.findById(existingParcel._id.toString()));
                if (current)
                    yield (0, EasyParcelTrackingSyncService_1.convergeOrderFromParcel)(current);
            }
            yield this.invalidateOrderCaches(order);
            return (yield order_model_1.default.findById(orderId));
        });
    }
    reconcileSubmittedShipment(orderId, shipmentNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
            if (!/^ES-[A-Z0-9-]+$/i.test(shipmentNumber || ''))
                throw new Error('A valid EasyParcel shipment number is required');
            const order = yield this.orderRepository.getOrderById(orderId);
            if (!order)
                throw new Error('Order not found');
            if (order.easyparcelShipmentId && order.easyparcelShipmentId !== shipmentNumber) {
                throw new Error('This order is already linked to a different EasyParcel shipment');
            }
            if (!order.easyparcelShipmentId && order.easyparcelBookingStatus !== 'submitted') {
                throw new Error('Only an uncertain submitted shipment can be reconciled manually');
            }
            const linkedOrder = yield order_model_1.default.findOne({ easyparcelShipmentId: shipmentNumber, _id: { $ne: orderId } }).select('_id').lean();
            if (linkedOrder)
                throw new Error('This EasyParcel shipment is already linked to another order');
            const requestedAt = new Date();
            const shipment = yield EasyParcelService_1.easyParcelService.getShipmentDetails(shipmentNumber);
            const reference = (_b = (_a = shipment.raw) === null || _a === void 0 ? void 0 : _a.shipment_details) === null || _b === void 0 ? void 0 : _b.reference;
            if (reference !== orderId) {
                throw new Error('EasyParcel shipment reference does not match this order');
            }
            const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
            yield this.orderRepository.updateOrder(orderId, {
                easyparcelOrderNo: ((_c = shipment.raw) === null || _c === void 0 ? void 0 : _c.order_number) || order.easyparcelOrderNo,
                easyparcelShipmentId: shipment.shipmentNumber,
                easyparcelBookingStatus: bookingStatus,
                easyparcelAwb: shipment.awbNumber || '',
                trackingNumber: shipment.awbNumber || '',
                awbUrl: shipment.awbUrl,
                awbUrlsByFormat: shipment.awbUrlsByFormat,
                trackingUrl: shipment.trackingUrl,
                courier: shipment.courier,
                shippingPrice: Number(((_e = (_d = shipment.raw) === null || _d === void 0 ? void 0 : _d.pricing) === null || _e === void 0 ? void 0 : _e.total_price) || ((_g = (_f = shipment.raw) === null || _f === void 0 ? void 0 : _f.pricing) === null || _g === void 0 ? void 0 : _g.shipment_price)) || order.shippingPrice,
            });
            const user = order.userId;
            const raw = shipment.raw || {};
            const reconciledParcel = yield ParcelRepository_1.parcelRepository.upsertByOrderId(orderId, {
                trackingNumber: shipment.awbNumber || undefined,
                easyparcelShipmentId: shipment.shipmentNumber,
                easyparcelOrderNumber: raw.order_number || order.easyparcelOrderNo,
                serviceId: ((_h = raw.courier) === null || _h === void 0 ? void 0 : _h.service_id) || order.easyparcelServiceId,
                courier: shipment.courier || order.courier || 'unknown',
                service: shipment.service,
                awbUrl: shipment.awbUrl,
                awbUrlsByFormat: shipment.awbUrlsByFormat,
                trackingUrl: shipment.trackingUrl,
                bookingStatus,
                collectionDate: order.shippingCollectionDate || (((_j = raw.shipment_details) === null || _j === void 0 ? void 0 : _j.coll_date) ? new Date(raw.shipment_details.coll_date) : undefined),
                shippingPrice: Number(((_k = raw.pricing) === null || _k === void 0 ? void 0 : _k.total_price) || ((_l = raw.pricing) === null || _l === void 0 ? void 0 : _l.shipment_price)) || order.shippingPrice,
                currency: ((_m = raw.pricing) === null || _m === void 0 ? void 0 : _m.currency_code) || 'MYR',
                dimensions: order.shippingDimensions || {
                    width: Number((_o = raw.shipment_details) === null || _o === void 0 ? void 0 : _o.width) || 0,
                    length: Number((_p = raw.shipment_details) === null || _p === void 0 ? void 0 : _p.length) || 0,
                    height: Number((_q = raw.shipment_details) === null || _q === void 0 ? void 0 : _q.height) || 0,
                },
                weight: order.shippingWeight || Number((_r = raw.shipment_details) === null || _r === void 0 ? void 0 : _r.weight) || 1,
                customerName: order.customerName,
                customerPhone: order.shippingCustomerPhone || ((_s = raw.receiver) === null || _s === void 0 ? void 0 : _s.contact) || (user === null || user === void 0 ? void 0 : user.phoneNumber) || 'Unavailable',
                customerEmail: order.shippingCustomerEmail || ((_t = raw.receiver) === null || _t === void 0 ? void 0 : _t.email) || (user === null || user === void 0 ? void 0 : user.email),
                senderName: ((_u = raw.sender) === null || _u === void 0 ? void 0 : _u.name) || process.env.EASYPARCEL_SENDER_NAME || 'Kampung Cetak',
                senderPhone: ((_v = raw.sender) === null || _v === void 0 ? void 0 : _v.contact) || process.env.EASYPARCEL_SENDER_PHONE || '',
                senderAddress: ((_w = raw.sender) === null || _w === void 0 ? void 0 : _w.address1) || process.env.EASYPARCEL_SENDER_ADDRESS_1 || '',
                recipientAddress: ((_x = raw.receiver) === null || _x === void 0 ? void 0 : _x.address1) || ((_y = order.address) === null || _y === void 0 ? void 0 : _y.street) || '',
            });
            if (shipment.statusCode !== undefined) {
                const applied = yield ParcelRepository_1.parcelRepository.updateProviderStatus(reconciledParcel._id.toString(), requestedAt, {
                    shipmentStatusCode: shipment.statusCode,
                    status: (0, EasyParcelService_1.mapEasyParcelStatus)(shipment.statusCode),
                });
                const current = applied || (yield ParcelRepository_1.parcelRepository.findById(reconciledParcel._id.toString()));
                if (current)
                    yield (0, EasyParcelTrackingSyncService_1.convergeOrderFromParcel)(current);
            }
            yield this.invalidateOrderCaches(order);
            return (yield order_model_1.default.findById(orderId));
        });
    }
    getTracking(orderId, requesterUserId, requesterRole) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const order = yield this.orderRepository.getOrderById(orderId);
            if (!order)
                throw new Error('Order not found');
            const staffRoles = ['admin', 'sysadmin', 'boss', 'production', 'packaging'];
            const ownerId = ((_b = (_a = order.userId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = order.userId) === null || _c === void 0 ? void 0 : _c.toString());
            if (!staffRoles.includes(requesterRole || '') && ownerId !== requesterUserId) {
                throw new Error('Order not found');
            }
            const parcel = (yield ParcelRepository_1.parcelRepository.findByOrderId(orderId))[0];
            if (!parcel)
                return { parcel: null, tracking: [] };
            let tracking = [];
            if (parcel.trackingNumber) {
                try {
                    tracking = yield EasyParcelService_1.easyParcelService.trackParcels([parcel.trackingNumber]);
                }
                catch (error) {
                    console.error('Live EasyParcel tracking unavailable; returning stored parcel status:', error);
                }
            }
            return {
                parcel: {
                    _id: parcel._id,
                    orderId: parcel.orderId,
                    trackingNumber: parcel.trackingNumber,
                    courier: parcel.courier,
                    status: parcel.status,
                    events: parcel.events,
                    bookingStatus: parcel.bookingStatus,
                    trackingUrl: parcel.trackingUrl,
                    updatedAt: parcel.updatedAt,
                },
                tracking,
            };
        });
    }
    processEasyParcelWebhook(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const topic = String((payload === null || payload === void 0 ? void 0 : payload.topic) || (payload === null || payload === void 0 ? void 0 : payload.event) || '');
            if (!['shipment.awb.update', 'shipment.status.update', 'shipment.tracking.update'].includes(topic))
                return false;
            const data = (payload === null || payload === void 0 ? void 0 : payload.data) || (payload === null || payload === void 0 ? void 0 : payload.payload) || payload || {};
            const shipmentNumber = String(data.shipment_number || '');
            if (!shipmentNumber)
                return false;
            const parcel = yield ParcelRepository_1.parcelRepository.findByShipmentId(shipmentNumber);
            if (!parcel)
                return false;
            const awb = data.awb_number || data.awb || parcel.trackingNumber;
            const statusCode = Number((_b = (_a = data.latest_shipment_status_code) !== null && _a !== void 0 ? _a : data.status_code) !== null && _b !== void 0 ? _b : data.shipment_status_code);
            const hasStatusCode = Number.isFinite(statusCode);
            const newStatus = hasStatusCode ? (0, EasyParcelService_1.mapEasyParcelStatus)(statusCode) : parcel.status;
            const statusChanged = parcel.shipmentStatusCode === undefined
                ? newStatus !== parcel.status
                : hasStatusCode && statusCode !== parcel.shipmentStatusCode;
            const eventSource = data.status_log || data.events || data.tracking_events;
            const incomingEvents = Array.isArray(eventSource)
                ? eventSource
                : eventSource && typeof eventSource === 'object'
                    ? Object.values(eventSource)
                    : [];
            const rawEvents = incomingEvents.length ? incomingEvents : [...(parcel.events || [])];
            const providerTimestampValues = [data.event_date, data.timestamp, payload === null || payload === void 0 ? void 0 : payload.event_date, payload === null || payload === void 0 ? void 0 : payload.timestamp]
                .concat(incomingEvents.map((event) => (event === null || event === void 0 ? void 0 : event.event_date) || (event === null || event === void 0 ? void 0 : event.timestamp) || (event === null || event === void 0 ? void 0 : event.datetime)))
                .map((value) => value ? new Date(value) : null)
                .filter((value) => Boolean(value && !Number.isNaN(value.getTime())));
            const providerStatusUpdatedAt = providerTimestampValues.length
                ? new Date(Math.max(...providerTimestampValues.map((value) => value.getTime())))
                : undefined;
            const events = rawEvents.map((event) => {
                var _a, _b, _c, _d;
                return ({
                    status: String((_d = (_c = (_b = (_a = event.shipment_status_code) !== null && _a !== void 0 ? _a : event.status) !== null && _b !== void 0 ? _b : event.status_name) !== null && _c !== void 0 ? _c : event.status_code) !== null && _d !== void 0 ? _d : ''),
                    description: String(event.tracking_status || event.description || event.message || ''),
                    location: String(event.location || ''),
                    timestamp: new Date(event.event_date || event.timestamp || event.datetime || Date.now()),
                });
            });
            if (!eventSource && hasStatusCode && statusChanged) {
                events.push({
                    status: String(statusCode),
                    description: String(data.latest_tracking_status || data.shipment_status || ''),
                    location: String(data.location || ''),
                    timestamp: new Date(data.event_date || data.timestamp || Date.now()),
                });
            }
            const parcelUpdate = {
                trackingNumber: awb || undefined,
                bookingStatus: awb ? 'booked' : parcel.bookingStatus,
                awbUrl: data.awb_url || parcel.awbUrl,
                trackingUrl: data.tracking_url || parcel.trackingUrl,
            };
            let statusApplied = false;
            let updatedParcel;
            if (hasStatusCode && providerStatusUpdatedAt) {
                updatedParcel = yield ParcelRepository_1.parcelRepository.updateProviderStatus(parcel._id.toString(), providerStatusUpdatedAt, Object.assign(Object.assign({}, parcelUpdate), { lastStatus: statusChanged ? parcel.status : parcel.lastStatus, status: newStatus, shipmentStatusCode: statusCode, events }));
                statusApplied = Boolean(updatedParcel);
            }
            if (!updatedParcel)
                updatedParcel = yield ParcelRepository_1.parcelRepository.update(parcel._id.toString(), parcelUpdate);
            const appliedStatusChanged = statusChanged && statusApplied;
            const orderUpdate = {
                easyparcelAwb: awb || '',
                trackingNumber: awb || '',
                easyparcelBookingStatus: awb ? 'booked' : parcel.bookingStatus,
                awbUrl: data.awb_url || parcel.awbUrl,
                trackingUrl: data.tracking_url || parcel.trackingUrl,
            };
            yield order_model_1.default.findByIdAndUpdate(parcel.orderId, { $set: orderUpdate });
            if (updatedParcel)
                yield (0, EasyParcelTrackingSyncService_1.convergeOrderFromParcel)(updatedParcel);
            if (appliedStatusChanged && (updatedParcel === null || updatedParcel === void 0 ? void 0 : updatedParcel.customerPhone) && (yield (0, CustomerUpdateSettingsService_1.areWhatsAppCustomerUpdatesEnabled)())) {
                yield whatsapp_service_1.default.sendMessage(updatedParcel.customerPhone, `Your order ${updatedParcel.orderId.slice(-8).toUpperCase()} is now ${newStatus.replace(/_/g, ' ')}. Tracking: ${awb || 'pending'}`);
            }
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + parcel.orderId);
            const linkedOrder = yield order_model_1.default.findById(parcel.orderId).select('userId').lean();
            if (linkedOrder === null || linkedOrder === void 0 ? void 0 : linkedOrder.userId)
                yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + linkedOrder.userId.toString());
            return true;
        });
    }
    getShippableOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.getOrderById(orderId);
            if (!order)
                throw new Error('Order not found');
            if (order.paymentStatus !== 'PAID')
                throw new Error('Order must be paid before shipping');
            if (!['DONE_PRINTING', 'PACKAGING'].includes(order.orderStatus)) {
                throw new Error('Order must be done printing or in packaging before shipping');
            }
            return order;
        });
    }
    buildShipment(order, input) {
        return {
            sender: this.buildSender(),
            receiver: this.buildReceiver(order, input),
            weight: input.weight,
            width: input.width,
            length: input.length,
            height: input.height,
            parcelValue: order.totalAmount,
        };
    }
    buildSender() {
        var _a, _b, _c, _d;
        const countryCode = (((_a = process.env.EASYPARCEL_SENDER_COUNTRY_CODE) === null || _a === void 0 ? void 0 : _a.trim()) || 'MY').toUpperCase();
        const subdivision = requiredSenderEnv('EASYPARCEL_SENDER_SUBDIVISION_CODE');
        return {
            name: requiredSenderEnv('EASYPARCEL_SENDER_NAME'),
            company: ((_b = process.env.EASYPARCEL_SENDER_COMPANY) === null || _b === void 0 ? void 0 : _b.trim()) || undefined,
            phone: (0, EasyParcelUtils_1.normalizeMalaysianPhone)(requiredSenderEnv('EASYPARCEL_SENDER_PHONE')),
            email: ((_c = process.env.EASYPARCEL_SENDER_EMAIL) === null || _c === void 0 ? void 0 : _c.trim()) || undefined,
            address1: requiredSenderEnv('EASYPARCEL_SENDER_ADDRESS_1'),
            address2: ((_d = process.env.EASYPARCEL_SENDER_ADDRESS_2) === null || _d === void 0 ? void 0 : _d.trim()) || undefined,
            postcode: requiredSenderEnv('EASYPARCEL_SENDER_POSTCODE'),
            city: requiredSenderEnv('EASYPARCEL_SENDER_CITY'),
            subdivisionCode: countryCode === 'MY' ? (0, EasyParcelUtils_1.toMalaysianSubdivisionCode)(subdivision) : subdivision,
            countryCode,
        };
    }
    buildReceiver(order, input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const user = order.userId;
        const phone = ((_a = input.customerPhone) === null || _a === void 0 ? void 0 : _a.trim()) || (user === null || user === void 0 ? void 0 : user.phoneNumber) || '';
        const email = ((_b = input.customerEmail) === null || _b === void 0 ? void 0 : _b.trim()) || (user === null || user === void 0 ? void 0 : user.email) || undefined;
        const country = (((_c = order.address) === null || _c === void 0 ? void 0 : _c.country) || 'MY').trim();
        const countryCode = /^(my|malaysia)$/i.test(country) ? 'MY' : country.toUpperCase();
        if (countryCode !== 'MY')
            throw new Error('Only Malaysian receiver addresses are currently supported');
        const state = ((_e = (_d = order.address) === null || _d === void 0 ? void 0 : _d.state) === null || _e === void 0 ? void 0 : _e.trim()) || ((_g = (_f = order.address) === null || _f === void 0 ? void 0 : _f.address) === null || _g === void 0 ? void 0 : _g.trim()) || '';
        const legacyAddress = (_j = (_h = order.address) === null || _h === void 0 ? void 0 : _h.address) === null || _j === void 0 ? void 0 : _j.trim();
        let address2 = legacyAddress && legacyAddress !== ((_k = order.address) === null || _k === void 0 ? void 0 : _k.street) ? legacyAddress : undefined;
        if (address2) {
            try {
                (0, EasyParcelUtils_1.toMalaysianSubdivisionCode)(address2);
                address2 = undefined;
            }
            catch (_p) {
                // Legacy checkout records sometimes stored the state in `address`.
            }
        }
        return {
            name: order.customerName,
            phone: (0, EasyParcelUtils_1.normalizeMalaysianPhone)(phone),
            email,
            address1: (_l = order.address) === null || _l === void 0 ? void 0 : _l.street,
            address2,
            postcode: (_m = order.address) === null || _m === void 0 ? void 0 : _m.postalCode,
            city: (_o = order.address) === null || _o === void 0 ? void 0 : _o.city,
            subdivisionCode: (0, EasyParcelUtils_1.toMalaysianSubdivisionCode)(state),
            countryCode,
        };
    }
    invalidateOrderCaches(order) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS);
            yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + order._id.toString());
            const userId = ((_a = order.userId) === null || _a === void 0 ? void 0 : _a._id) || order.userId;
            if (userId)
                yield this.redisService.del(redis_constant_1.REDIS_KEYS.ORDERS + userId.toString());
        });
    }
}
exports.OrderUsecase = OrderUsecase;
