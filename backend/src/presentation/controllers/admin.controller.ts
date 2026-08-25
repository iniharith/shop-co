/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS, Roles.DESIGNER, Roles.PRODUCTION, Roles.PACKAGING, Roles.AWAPPAREL].includes(req.role as Roles)) {
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
            const safeUser = user.toObject();
            delete (safeUser as any).password;
            res.status(statusCodes.CREATED).json({
                message: "User created successfully",
                user: safeUser
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
            const safeUser = user?.toObject();
            if (safeUser) delete (safeUser as any).password;
            res.status(statusCodes.OK).json({
                message: "User updated successfully",
                user: safeUser
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
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS, Roles.DESIGNER, Roles.PRODUCTION, Roles.PACKAGING].includes(req.role as Roles)) {
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
     * @description Delete order
     * @Method DELETE
     * @Route /api/admin/orders/:id
     */
    async deleteOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const { id } = req.params;
            await this.adminUsecase.deleteOrder(id);
            res.status(statusCodes.OK).json({
                message: "Order deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Bulk delete orders
     * @Method POST
     * @Route /api/admin/orders/bulk-delete
     */
    async bulkDeleteOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            const { orderIds } = req.body;
            if (!Array.isArray(orderIds)) throw new Error("orderIds must be an array");
            
            for (const id of orderIds) {
                await this.adminUsecase.deleteOrder(id);
            }
            res.status(statusCodes.OK).json({
                message: `${orderIds.length} orders deleted successfully`
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
     * @description Clear test data
     * @Method DELETE
     * @Route /api/admin/clear-test-data
     */
    async clearTestData(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (![Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(req.role as Roles)) {
                throw new Error(messages.UNAUTHORIZED)
            }
            await this.adminUsecase.clearTestData();
            res.status(statusCodes.OK).json({
                message: "Test data cleared successfully"
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
