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
exports.OrderController = void 0;
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
/** @Controller */
class OrderController {
    constructor() {
        this.orderUsecase = new order_usecase_1.OrderUsecase();
    }
    /**
     * @description Get all orders
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders
     * @Response 200 - Orders fetched successfully
     */
    getOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.orderUsecase.getOrders();
                res.status(api_constant_1.statusCodes.OK).json({ message: "Orders fetched successfully", orders });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
         * @description Get order byUserId
         * @Method GET
         * @Access PRIVATE
         * @Route /api/orders/user/
         * @Response 200 - Orders fetched successfully
         */
    getOrdersByUserId(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const orders = yield this.orderUsecase.getOrdersByUserId(userId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Orders fetched successfully", orders });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get order byId
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/:orderId
     * @Response 200 - Order fetched successfully
     */
    getOrderById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.orderUsecase.getOrderById(req.params.orderId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Order fetched successfully", order });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Create order
     * @Method POST
     * @Access PRIVATE
     * @Route /api/orders
     * @Response 200 - Order created successfully
     */
    createOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { address, customerName, orderNotes } = req.body;
                const order = yield this.orderUsecase.createOrder(address, req.userId, customerName, orderNotes);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Order created successfully", order });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Update order status
     * @Method PUT
     * @Access PRIVATE
     * @Route /api/orders/:orderId
     * @Response 200 - Order status updated successfully
     */
    updateOrderStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status } = req.body;
                const order = yield this.orderUsecase.updateOrderStatus(req.params.orderId, status);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Order status updated successfully", order });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get orders by status
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/status/:status
     * @Response 200 - Orders fetched successfully
     */
    getOrdersByStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.orderUsecase.getOrdersByStatus(req.params.status);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Orders fetched successfully", orders });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get distinct address
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/previous-address
     * @Response 200 - Distinct address fetched successfully
     */
    getDistintAddress(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const address = yield this.orderUsecase.getDistintAddress(req.userId);
                res.status(api_constant_1.statusCodes.OK).json({ message: "Distinct address fetched successfully", address });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.OrderController = OrderController;
