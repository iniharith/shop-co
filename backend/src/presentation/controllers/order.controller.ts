/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextFunction, Response } from "express";
import { OrderUsecase } from "../../application/usecases/orders/order.usecase";
import { AuthRequest } from "../../domain/types/api";
import { statusCodes } from "../../shared/constants/api.constant";



/** @Controller */
export class OrderController {
    private readonly orderUsecase: OrderUsecase;
    constructor() {
        this.orderUsecase = new OrderUsecase();
    }

    /**
     * @description Get all orders
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders
     * @Response 200 - Orders fetched successfully
     */
    async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const orders = await this.orderUsecase.getOrders();
            res.status(statusCodes.OK).json({ message: "Orders fetched successfully", orders });
        } catch (error: any) {
            next(error);
        }
    }

/**
     * @description Get order byUserId
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/user/
     * @Response 200 - Orders fetched successfully
     */
    async getOrdersByUserId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId as string;
            const orders = await this.orderUsecase.getOrdersByUserId(userId);
            res.status(statusCodes.OK).json({ message: "Orders fetched successfully", orders });
        } catch (error: any) {
            next(error);
        }
    }


    /**
     * @description Get order byId
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/:orderId
     * @Response 200 - Order fetched successfully
     */ 
    async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const order = await this.orderUsecase.getOrderById(req.params.orderId);
            res.status(statusCodes.OK).json({ message: "Order fetched successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * @description Create order
     * @Method POST
     * @Access PRIVATE
     * @Route /api/orders
     * @Response 200 - Order created successfully
     */ 
    async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { address, customerName, orderNotes, shippingPrice, courier } = req.body;
            const order = await this.orderUsecase.createOrder(address, req.userId as string, customerName, orderNotes, shippingPrice, courier);
            res.status(statusCodes.OK).json({ message: "Order created successfully", order });
        } catch (error: any) {
            next(error);
        }
    }


    /**
     * @description Update order status
     * @Method PUT
     * @Access PRIVATE
     * @Route /api/orders/:orderId
     * @Response 200 - Order status updated successfully
     */
    async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { status } = req.body;
            const order = await this.orderUsecase.updateOrderStatus(req.params.orderId, status);
            res.status(statusCodes.OK).json({ message: "Order status updated successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * @description Toggle archive order
     * @Method PATCH
     * @Access PRIVATE
     * @Route /api/orders/:orderId/archive
     * @Response 200 - Order archive status toggled successfully
     */
    async archiveOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { isArchived } = req.body;
            const order = await this.orderUsecase.toggleArchiveStatus(req.params.orderId, isArchived);
            res.status(statusCodes.OK).json({ message: "Order archive status updated successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * @description Get orders by status
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/status/:status
     * @Response 200 - Orders fetched successfully
     */ 
    async getOrdersByStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const orders = await this.orderUsecase.getOrdersByStatus(req.params.status as "PLACED" | "IN_PROGRESS" | "PENDING_ARTWORK" | "ARTWORK_REVIEWED" | "ARTWORK_REJECTED" | "IN_DESIGN" | "PEMBETULAN" | "DONE_DESIGN" | "IN_PRODUCTION" | "PRINT_AWB" | "DONE_PRINTING" | "PACKAGING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "CANCELLED" | "FAILED");
            res.status(statusCodes.OK).json({ message: "Orders fetched successfully", orders });
        } catch (error: any) {
            next(error);
        }
    }




    /**
     * @description Get distinct address
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/previous-address
     * @Response 200 - Distinct address fetched successfully
     */
    async getDistintAddress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const address = await this.orderUsecase.getDistintAddress(req.userId as string);
            res.status(statusCodes.OK).json({ message: "Distinct address fetched successfully", address });
        } catch (error: any) {
            next(error);
        }
    }


    
    /**
     * @description Create EasyParcel Shipment
     * @Method POST
     * @Access PRIVATE
     * @Route /api/orders/:orderId/ship
     */
    async createShipment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const order = await this.orderUsecase.createShipment(req.params.orderId, req.body);
            res.status(statusCodes.OK).json({ message: "Shipment created successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    async getShippingQuotations(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const quotations = await this.orderUsecase.getShippingQuotations(req.params.orderId, req.body);
            res.status(statusCodes.OK).json({ message: "Shipping quotations fetched successfully", quotations });
        } catch (error: any) {
            next(error);
        }
    }

    async refreshShipping(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const order = await this.orderUsecase.refreshShipping(req.params.orderId);
            res.status(statusCodes.OK).json({ message: "Shipment refreshed successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    async reconcileShipping(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const order = await this.orderUsecase.reconcileSubmittedShipment(req.params.orderId, req.body.shipmentNumber);
            res.status(statusCodes.OK).json({ message: "Shipment reconciled successfully", order });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * @description Get live tracking status
     * @Method GET
     * @Access PRIVATE
     * @Route /api/orders/:orderId/tracking
     */
    async getPublicShippingQuotations(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const quotations = await this.orderUsecase.getPublicShippingQuotations(req.body);
            res.status(statusCodes.OK).json({ message: "Shipping quotations fetched successfully", quotations });
        } catch (error: any) {
            console.error('Public shipping quotation failed:', error?.message || error);
            res.status(statusCodes.OK).json({
                message: "Shipping rates temporarily unavailable",
                quotations: [],
                error: error?.message || 'Shipping service error',
            });
        }
    }

    async getTracking(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await this.orderUsecase.getTracking(req.params.orderId, req.userId as string, req.role);
            res.status(statusCodes.OK).json({ message: "Tracking status fetched successfully", ...result });
        } catch (error: any) {
            next(error);
        }
    }
}
