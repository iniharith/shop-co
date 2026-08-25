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
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS, user_type_1.Roles.DESIGNER, user_type_1.Roles.PRODUCTION, user_type_1.Roles.PACKAGING, user_type_1.Roles.AWAPPAREL].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const users = yield this.adminUsecase.getAllUsers();
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
     * @description Delete user
     * @Method DELETE
     * @Route /api/admin/users/:id
     * @Response 200 - User deleted successfully
     * @Response 400 - User not found
     */
    deleteUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                yield this.adminUsecase.deleteUser(id);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "User deleted successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Create user
     * @Method POST
     * @Route /api/admin/users
     */
    createUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const user = yield this.adminUsecase.createUser(req.body);
                const safeUser = user.toObject();
                delete safeUser.password;
                res.status(api_constant_1.statusCodes.CREATED).json({
                    message: "User created successfully",
                    user: safeUser
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Update user
     * @Method PUT
     * @Route /api/admin/users/:id
     */
    updateUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                const user = yield this.adminUsecase.updateUser(id, req.body);
                const safeUser = user === null || user === void 0 ? void 0 : user.toObject();
                if (safeUser)
                    delete safeUser.password;
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "User updated successfully",
                    user: safeUser
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
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS, user_type_1.Roles.DESIGNER, user_type_1.Roles.PRODUCTION, user_type_1.Roles.PACKAGING].includes(req.role)) {
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
     * @description Delete order
     * @Method DELETE
     * @Route /api/admin/orders/:id
     */
    deleteOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { id } = req.params;
                yield this.adminUsecase.deleteOrder(id);
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Order deleted successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Bulk delete orders
     * @Method POST
     * @Route /api/admin/orders/bulk-delete
     */
    bulkDeleteOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const { orderIds } = req.body;
                if (!Array.isArray(orderIds))
                    throw new Error("orderIds must be an array");
                for (const id of orderIds) {
                    yield this.adminUsecase.deleteOrder(id);
                }
                res.status(api_constant_1.statusCodes.OK).json({
                    message: `${orderIds.length} orders deleted successfully`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Seed test data
     * @Method POST
     * @Route /api/admin/seed-test-data
     */
    seedTestData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                yield this.adminUsecase.seedTestData();
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Test data seeded successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Clear test data
     * @Method DELETE
     * @Route /api/admin/clear-test-data
     */
    clearTestData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                yield this.adminUsecase.clearTestData();
                res.status(api_constant_1.statusCodes.OK).json({
                    message: "Test data cleared successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Create manual order
     * @Method POST
     * @Route /api/admin/orders/manual
     */
    createManualOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![user_type_1.Roles.ADMIN, user_type_1.Roles.SYSADMIN, user_type_1.Roles.BOSS].includes(req.role)) {
                    throw new Error(api_constant_1.messages.UNAUTHORIZED);
                }
                const order = yield this.adminUsecase.createManualOrder(req.body);
                res.status(api_constant_1.statusCodes.CREATED).json({
                    message: "Manual order created successfully",
                    order
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.AdminController = AdminController;
