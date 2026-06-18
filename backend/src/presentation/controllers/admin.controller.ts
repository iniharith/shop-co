import { NextFunction, Response } from "express";
import { AdminUsecase } from "../../application/usecases/admin/admin.usecaes";
import { Roles } from "../../domain/types/user.type";
import { AuthRequest } from "../../domain/types/api";
import { statusCodes, messages } from "../../shared/constants/api.constant";
import { OrderUsecase } from "../../application/usecases/orders/order.usecase";
/**  @Controller */
export class AdminController {

    /**
     * @description Admin usecase
     */
    private readonly adminUsecase: AdminUsecase;
    private readonly orderUsecase: OrderUsecase;

    constructor() {
        this.adminUsecase = new AdminUsecase();
        this.orderUsecase = new OrderUsecase();
    }

    /**
     * @description Get users
     * @Method GET
     * @Route /api/admin/users
     * @Response 200 - Users fetched successfully
     * @Response 400 - Users not found
     * @ResponseJson {success: boolean, message: string, users: IUserDocument[]}
     */
    async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const users = await this.adminUsecase.getAllUsers();
            res.status(statusCodes.OK).json({
                message: "Users fetched successfully",
                users: users
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Delete user
     * @Method DELETE
     * @Route /api/admin/users/:id
     * @Response 200 - User deleted successfully
     * @Response 400 - User not found
     */
    async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const { id } = req.params;
            await this.adminUsecase.deleteUser(id);
            res.status(statusCodes.OK).json({
                message: "User deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Create user
     * @Method POST
     * @Route /api/admin/users
     */
    async createUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED);
            }
            const user = await this.adminUsecase.createUser(req.body);
            res.status(statusCodes.CREATED).json({
                message: "User created successfully",
                user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Update user
     * @Method PUT
     * @Route /api/admin/users/:id
     */
    async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED);
            }
            const { id } = req.params;
            const user = await this.adminUsecase.updateUser(id, req.body);
            res.status(statusCodes.OK).json({
                message: "User updated successfully",
                user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Get delivery boys
     * @Method GET
     * @Route /api/admin/delivery-boys
     * @Response 200 - Delivery boys fetched successfully
     * @Response 400 - Delivery boys not found
     * @ResponseJson {success: boolean, message: string, deliveryBoys: IUserDocument[]}
     */
    async getDeliveryBoys(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const deliveryBoys = await this.adminUsecase.getUsersByRole(Roles.DELIVERY_BOY);
            res.status(statusCodes.OK).json({
                message: "Delivery Boys fetched successfully",
                deliveryBoys: deliveryBoys
            });
        } catch (error) {
            next(error);
        }
    }


    /**
     * @description Update delivery boy
     * @Method PUT
     * @Route /api/admin/delivery-boys/:id
     * @Response 200 - Delivery boy updated successfully
     * @Response 400 - Delivery boy not found
     */
    async updateDeliveryBoy(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const { id } = req.params;
            const { status } = req.body;
            const deliveryBoy = await this.adminUsecase.verifyUser(id, status);
            res.status(statusCodes.OK).json({
                message: "Delivery boy updated successfully",
                deliveryBoy: deliveryBoy
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Get orders
     * @Method GET
     * @Route /api/admin/orders
     * @Response 200 - Orders fetched successfully
     * @Response 400 - Orders not found
     */
    async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS, Roles.DELIVERY_BOY].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const orders = await this.adminUsecase.getOrders();
            res.status(statusCodes.OK).json({
                message: "Orders fetched successfully",
                orders: orders
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Get orders by delivery boy
     * @Method GET
     * @Route /api/admin/orders/delivery-boy
     * @Response 200 - Orders fetched successfully
     * @Response 400 - Orders not found
     */
    async getOrdersByDeliveryBoy(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS, Roles.DELIVERY_BOY].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const { id } = req.params;
            const orders = await this.adminUsecase.getOrdersByDeliveryBoy(id);
            res.status(statusCodes.OK).json({
                message: "Orders fetched successfully",
                orders: orders
            });
        } catch (error) {
            next(error);
        }
    }



    /**
     * @description Seed test data
     * @Method POST
     * @Route /api/admin/seed-test-data
     */
    async seedTestData(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            await this.adminUsecase.seedTestData();
            res.status(statusCodes.OK).json({
                message: "Test data seeded successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Create manual order
     * @Method POST
     * @Route /api/admin/orders/manual
     */
    async createManualOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED);
            }
            const order = await this.adminUsecase.createManualOrder(req.body);
            res.status(statusCodes.CREATED).json({
                message: "Manual order created successfully",
                order
            });
        } catch (error) {
            next(error);
        }
    }


}

