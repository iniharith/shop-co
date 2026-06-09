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
exports.AdminController = void 0;
const admin_usecaes_1 = require("../../application/usecases/admin/admin.usecaes");
const user_type_1 = require("../../domain/types/user.type");
const api_constant_1 = require("../../shared/constants/api.constant");
const order_usecase_1 = require("../../application/usecases/orders/order.usecase");
/**  @Controller */
class AdminController {
    constructor() {
        this.adminUsecase = new admin_usecaes_1.AdminUsecase();
        this.orderUsecase = new order_usecase_1.OrderUsecase();
    }
    /**
     * @description Get users
     * @Method GET
     * @Route /api/admin/users
     * @Response 200 - Users fetched successfully
     * @Response 400 - Users not found
     * @ResponseJson {success: boolean, message: string, users: IUserDocument[]}
     */
    getUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.ADMIN) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const users = yield this.adminUsecase.getUsersByRole(user_type_1.Roles.CLIENT);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Users fetched successfully",
                    users: users
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get delivery boys
     * @Method GET
     * @Route /api/admin/delivery-boys
     * @Response 200 - Delivery boys fetched successfully
     * @Response 400 - Delivery boys not found
     * @ResponseJson {success: boolean, message: string, deliveryBoys: IUserDocument[]}
     */
    getDeliveryBoys(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.ADMIN) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const deliveryBoys = yield this.adminUsecase.getUsersByRole(user_type_1.Roles.DELIVERY_BOY);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Delivery Boys fetched successfully",
                    deliveryBoys: deliveryBoys
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Update delivery boy
     * @Method PUT
     * @Route /api/admin/delivery-boys/:id
     * @Response 200 - Delivery boy updated successfully
     * @Response 400 - Delivery boy not found
     */
    updateDeliveryBoy(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.ADMIN) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                const { status } = req.body;
                const deliveryBoy = yield this.adminUsecase.verifyUser(id, status);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Delivery boy updated successfully",
                    deliveryBoy: deliveryBoy
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
     * @Route /api/admin/orders
     * @Response 200 - Orders fetched successfully
     * @Response 400 - Orders not found
     */
    getOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.ADMIN && req.role !== user_type_1.Roles.DELIVERY_BOY) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const orders = yield this.adminUsecase.getOrders();
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
     * @description Get orders by delivery boy
     * @Method GET
     * @Route /api/admin/orders/delivery-boy
     * @Response 200 - Orders fetched successfully
     * @Response 400 - Orders not found
     */
    getOrdersByDeliveryBoy(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.role !== user_type_1.Roles.DELIVERY_BOY && req.role !== user_type_1.Roles.ADMIN) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                const orders = yield this.adminUsecase.getOrdersByDeliveryBoy(id);
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
}
exports.AdminController = AdminController;
