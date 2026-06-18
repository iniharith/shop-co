import { Types } from "mongoose";
import { IAddress, IOrderDocument } from "../../../domain/interfaces/order.interface";
import { CartRepository } from "../../../infrastructure/db/repositories/cart.repository";
import { OrderRepository } from "../../../infrastructure/db/repositories/order.repository";
import { ProductRepository } from "../../../infrastructure/db/repositories/product.repository";
import { UserRepository } from "../../../infrastructure/db/repositories/user.repository";
import { NotificationUsecase } from "../notification/notification.usecase";
import { RedisService } from "../../../infrastructure/redis/redis";
import { REDIS_CHANNELS, REDIS_KEYS } from "../../../shared/constants/redis.constant";
import { IUserDocument } from "../../../domain/interfaces/user.interface";
import WhatsAppService from "../../../infrastructure/whatsapp/whatsapp.service";
export class OrderUsecase {
    private readonly orderRepository: OrderRepository
    private readonly productRepository: ProductRepository
    private readonly cartRepository: CartRepository
    private readonly userRepository: UserRepository
    private readonly notificationUsecase: NotificationUsecase
    private readonly redisService: RedisService
    constructor() {
        this.orderRepository = new OrderRepository();
        this.productRepository = new ProductRepository();
        this.cartRepository = new CartRepository();
        this.userRepository = new UserRepository();
        this.notificationUsecase = new NotificationUsecase();
        this.redisService = new RedisService();
    }

    async getOrders() {
        const cachedOrders = await this.redisService.get(REDIS_KEYS.ORDERS);
        if (cachedOrders) {
            return JSON.parse(cachedOrders);
        }
        const orders = await this.orderRepository.getOrders();
        await this.redisService.set(REDIS_KEYS.ORDERS, JSON.stringify(orders), 60 * 60 * 24);
        return orders;
    }


    async getOrdersByUserId(userId: string): Promise<IOrderDocument[]> {
        const cachedOrders = await this.redisService.get(REDIS_KEYS.ORDERS + userId);
        if (cachedOrders) {
            return JSON.parse(cachedOrders);
        }
        const orders = await this.orderRepository.getOrdersByUserId(userId);
        await this.redisService.set(REDIS_KEYS.ORDERS + userId, JSON.stringify(orders), 60 * 60 * 24);
        return orders;
    }

    async getOrderById(orderId: string): Promise<IOrderDocument | null> {
        const cachedOrder = await this.redisService.get(REDIS_KEYS.ORDERS + orderId);
        if (cachedOrder) {
            return JSON.parse(cachedOrder);
        }
        const order = await this.orderRepository.getOrderById(orderId);
        await this.redisService.set(REDIS_KEYS.ORDERS + orderId, JSON.stringify(order), 60 * 60 * 24);
        await this.redisService.del(REDIS_KEYS.ORDERS + (order?.userId as IUserDocument)?._id);
        return order;
    }

    async createOrder(address: IAddress, userId: string, customerName: string, orderNotes: string): Promise<IOrderDocument> {

        const cart = await this.cartRepository.getCartByUserId(userId);
        if (!cart || !cart.items || !cart?.items?.length) {
            throw new Error("Cart did'nt have products , add Some Products In Cart");
        }
        let totalAmount = 0;
        const orderItems = [];
        for (const item of cart.items) {

            const product = await this.productRepository.findById(item.product._id.toString());
            if (!product) throw new Error(`Product not found: ${item.product._id}`);
            const sizePerProdut = product.sizes.find(e => e.size == item.size);
            if (!sizePerProdut || sizePerProdut.stock <= 0) throw new Error(`Insufficient stock for product: ${product.name}`);
            const updatedProduct = await this.productRepository.updateProductStockBySize(product._id.toString(), item.size, -item.quantity);

            const productPrice = product.price * item.quantity;
            orderItems.push({
                product: item.product._id as Types.ObjectId,
                quantity: item.quantity,
                price: productPrice,
                size: item.size,
                artworkUrl: item.artworkUrl
            });
            totalAmount += productPrice;
        }
        await this.redisService.del(REDIS_KEYS.ORDERS + userId);
        await this.redisService.del(REDIS_KEYS.CART + userId);
        await this.redisService.del(REDIS_KEYS.PRODUCTS);
        await this.redisService.del(REDIS_KEYS.CATEGORIES);
        await this.redisService.del(REDIS_KEYS.ADDRESS + userId);

        const order = await this.orderRepository.createOrder({
            userId,
            customerName,
            orderNotes,
            address,
            paymentMethod: "COD",
            products: orderItems,
            totalAmount
        })
        await this.notificationUsecase.createNotification({
            userId: userId,
            title: "Order Placed",
            message: "Your order has been placed successfully",
            type: "ORDER",
            orderId: order._id.toString(),
            read: false
        })
        await this.cartRepository.clearCart(userId);
        await this.redisService.publish(REDIS_CHANNELS.ORDER_PLACED, 'order placed');
        return order;
    }

    async updateOrderStatus(orderId: string, updateStatus: "PLACED" | "PENDING_ARTWORK" | "ARTWORK_REVIEW" | "ARTWORK_REJECTED" | "IN_DESIGN" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
        const order = await this.orderRepository.updateOrder(orderId, { orderStatus: updateStatus });
        if (!order) throw new Error("Order not found");
        await this.notificationUsecase.createNotification({
            userId: order?.userId?.toString(),
            title: "Order Status Updated",
            message: `Your order has been ${updateStatus}`,
            type: "ORDER",
            orderId: order?._id.toString(),
            read: false
        })

        const user = await this.userRepository.findById(order.userId.toString());
        if (user && user.phone) {
            let message = `Hello ${user.name || 'Customer'}, your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) status has been updated to: *${updateStatus}*.\n\nThank you for shopping with KampungCetak!`;
            
            if (updateStatus === "ARTWORK_REJECTED") {
                message = `Hello ${user.name || 'Customer'}, unfortunately the artwork for your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) was REJECTED.\n\nPlease re-upload the correct picture/file via your dashboard.`;
            }

            WhatsAppService.sendMessage(user.phone, message).catch(err => console.error("WA Error:", err));
        }

        await this.redisService.del(REDIS_KEYS.ORDERS + orderId);
        return order;

    }


    async getOrdersByStatus(status: "PLACED" | "PENDING_ARTWORK" | "ARTWORK_REVIEW" | "ARTWORK_REJECTED" | "IN_DESIGN" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
        const cachedOrders = await this.redisService.get(REDIS_KEYS.ORDERS + status);
        if (cachedOrders) {
            return JSON.parse(cachedOrders);
        }
        const orders = await this.orderRepository.getOrderByStatus(status);
        await this.redisService.set(REDIS_KEYS.ORDERS + status, JSON.stringify(orders), 60 * 60 * 24);
        return orders;
    }




    async getDistintAddress(userId: string) {
        const cachedAddress = await this.redisService.get(REDIS_KEYS.ADDRESS + userId);
        if (cachedAddress) {
            return JSON.parse(cachedAddress);
        }
        const address = await this.orderRepository.getDistintValues(userId, "address");
        await this.redisService.set(REDIS_KEYS.ADDRESS + userId, JSON.stringify(address), 60 * 60 * 24);
        return address;
    }



}
