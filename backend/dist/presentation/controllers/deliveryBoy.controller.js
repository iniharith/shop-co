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
exports.DeliveryBoyController = void 0;
const api_constant_1 = require("../../shared/constants/api.constant");
const deliveryBoy_1 = require("../../application/usecases/deliveryBoy/deliveryBoy");
const admin_usecaes_1 = require("../../application/usecases/admin/admin.usecaes");
const user_type_1 = require("../../domain/types/user.type");
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
/**  @Controller */
class DeliveryBoyController {
    constructor() {
        this.deliveryBoyUsecase = new deliveryBoy_1.DeliveryBoyUsecase();
        this.adminUsecase = new admin_usecaes_1.AdminUsecase();
        this.orderUsecase = new order_usecase_1.OrderUsecase();
    }
    /**
     * @description Login delivery boy or admin
     * @Method POST
     * @Route /api/auth/delivery-boy/login
     * @Body email: string, password: string
     * @Response 200 - User logged in successfully
     * @Response 400 - Email and password are required
     * @Response 500 - Internal server error
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Email and password are required"
                    });
                }
                const { user, accessToken, refreshToken } = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD ?
                    yield this.adminUsecase.adminLogin(email, password) :
                    yield this.deliveryBoyUsecase.loginDeliveryBoy(email, password);
                const message = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD ? "Admin logged in successfully" : "Delivery boy logged in successfully";
                res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message,
                    user,
                    accessToken,
                    refreshToken
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Register delivery boy
     * @Method POST
     * @Route /api/auth/delivery-boy/register
     * @Body email: string, password: string, name: string
     * @Response 201 - Delivery boy registered successfully
     * @Response 400 - Email, password and name are required
     * @Response 500 - Internal server error
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, name } = req.body;
                if (!email || !password || !name) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Email, password and name are required"
                    });
                }
                const { user, accessToken, refreshToken } = yield this.deliveryBoyUsecase.registerDeliveryBoy({ email, password, name });
                res.status(api_constant_1.statusCodes.CREATED).json({
                    success: true,
                    message: "Delivery boy registered successfully",
                    user,
                    accessToken,
                    refreshToken
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Add delivery boy to order
     * @Method POST
     * @Route /api/delivery-boy/orders/:id
     * @Response 200 - Delivery boy added to order successfully
     * @Response 400 - Delivery boy not found
     */
    addDeliveryBoyToOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.DELIVERY_BOY) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                const userId = req.userId;
                const order = yield this.orderUsecase.addDeliveryBoyToOrder(id, userId);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Delivery boy added to order successfully",
                    order: order
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get orders
     * @Method GET
     * @Route /api/delivery-boy/orders
     * @Response 200 - Orders fetched successfully
     * @Response 400 - Orders not found
     */
    getOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.DELIVERY_BOY) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const userId = req.userId;
                const orders = yield this.orderUsecase.getOrdersByDeliveryBoy(userId);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Orders fetched successfully",
                    orders: orders
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description update order status
     * @Method PUT
     * @Route /api/delivery-boy/orders/:id
     * @Response 200 - Order status updated successfully
     * @Response 400 - Order not found
     */
    updateOrderStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.DELIVERY_BOY) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                const { status } = req.body;
                const order = yield this.orderUsecase.updateOrderStatus(id, status);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Order status updated successfully",
                    order: order
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.DeliveryBoyController = DeliveryBoyController;
exports.default = new DeliveryBoyController();
