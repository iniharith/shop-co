/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Model, UpdateQuery } from "mongoose";
import { IOrder, IOrderDocument } from "../../../domain/interfaces/order.interface";
import OrderModel from "../models/order.model";

export class OrderRepository {
    private orderModel: Model<IOrderDocument>;

    constructor() {
        this.orderModel = OrderModel;
    }


    async getOrders(): Promise<IOrderDocument[]> {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return await this.orderModel.find({ createdAt: { $gte: sixtyDaysAgo } }).populate("products.product").populate("userId").sort({ createdAt: -1 }).lean() as unknown as Promise<IOrderDocument[]>;
    }

    async getOrdersByUserId(userId: string): Promise<IOrderDocument[]> {
        return await this.orderModel.find({ userId }).populate("products.product").populate("userId");
    }

    async getOrderById(orderId: string): Promise<IOrderDocument | null> {
        return await this.orderModel.findById(orderId).populate("products.product").populate("userId");
    }

    async getOrderByAwb(awb: string): Promise<IOrderDocument | null> {
        return await this.orderModel.findOne({ easyparcelAwb: awb }).populate("products.product").populate("userId");
    }

    async createOrder(order: Partial<IOrder>): Promise<IOrderDocument> {
        return await this.orderModel.create(order);
    }

    async updateOrder(orderId: string, order: UpdateQuery<IOrderDocument>): Promise<IOrderDocument | null> {
        return await this.orderModel.findByIdAndUpdate(orderId, order, { new: true });
    }

    async deleteOrder(orderId: string): Promise<IOrderDocument | null> {
        return await this.orderModel.findByIdAndDelete(orderId);
    }


    async getDistintValues(userId: string, field: string): Promise<IOrderDocument[]> {
        return await this.orderModel.distinct(field, { userId });
    }


    async getOrderByStatus(status: string): Promise<IOrderDocument[]> {
        return await this.orderModel.find({ status }).populate("products.product").populate("userId");
    }

    async getOderByDeliveryBoy(deliveryBoy: string): Promise<IOrderDocument[]> {
        return await this.orderModel.find({ deliveryBoy }).populate("products.product").populate("userId");
    }

    async getOderByDeliveryBoyAndStatus(deliveryBoy: string, status: string): Promise<IOrderDocument[]> {
        return await this.orderModel.find({ deliveryBoy, status }).populate("products.product").populate("userId");
    }


}

export default new OrderRepository();   