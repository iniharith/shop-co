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
exports.OrderRepository = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
class OrderRepository {
    constructor() {
        this.orderModel = order_model_1.default;
    }
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.find().populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
    getOrdersByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.find({ userId }).populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
    getOrderById(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.findById(orderId).populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
    createOrder(order) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.create(order);
        });
    }
    updateOrder(orderId, order) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.findByIdAndUpdate(orderId, order, { new: true });
        });
    }
    getDistintValues(userId, field) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.distinct(field, { userId });
        });
    }
    getOrderByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.find({ status }).populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
    getOderByDeliveryBoy(deliveryBoy) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.find({ deliveryBoy }).populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
    getOderByDeliveryBoyAndStatus(deliveryBoy, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderModel.find({ deliveryBoy, status }).populate("products.product").populate("deliveryBoy").populate("userId");
        });
    }
}
exports.OrderRepository = OrderRepository;
exports.default = new OrderRepository();
