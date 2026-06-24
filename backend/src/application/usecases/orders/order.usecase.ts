import { Types } from "mongoose";
import { IAddress, IOrderDocument } from "../../../domain/interfaces/order.interface";
import { CartRepository } from "../../../infrastructure/db/repositories/cart.repository";
import { OrderRepository } from "../../../infrastructure/db/repositories/order.repository";
import { ProductRepository } from "../../../infrastructure/db/repositories/product.repository";
import { UserRepository } from "../../../infrastructure/db/repositories/user.repository";
import { NotificationUsecase } from "../notification/notification.usecase";
import { TaskRepository } from "../../../infrastructure/repositories/TaskRepository";
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
    private readonly taskRepository: TaskRepository
    constructor() {
        this.orderRepository = new OrderRepository();
        this.productRepository = new ProductRepository();
        this.cartRepository = new CartRepository();
        this.userRepository = new UserRepository();
        this.notificationUsecase = new NotificationUsecase();
        this.redisService = new RedisService();
        this.taskRepository = new TaskRepository();
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
        
        // Auto-create Task for this order
        try {
            await this.taskRepository.create({
                title: `Order: ${order._id.toString().slice(-6).toUpperCase()} - ${customerName}`,
                description: `Auto-generated task for Order ${order._id.toString()}.\nNotes: ${orderNotes}`,
                orderId: order._id.toString(),
                customerUsername: customerName,
                status: 'PLACED',
            });
        } catch (e) {
            console.error('Failed to auto-create task for order:', e);
        }

        await this.redisService.publish(REDIS_CHANNELS.ORDER_PLACED, 'order placed');
        return order;
    }

    async updateOrderStatus(orderId: string, updateStatus: "PLACED" | "IN_PROGRESS" | "PENDING_ARTWORK" | "ARTWORK_REVIEWED" | "ARTWORK_REJECTED" | "IN_DESIGN" | "PEMBETULAN" | "DONE_DESIGN" | "IN_PRODUCTION" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "FAILED") {
        const order = await this.orderRepository.updateOrder(orderId, { orderStatus: updateStatus });
        if (!order) throw new Error("Order not found");
        
        if (order.userId) {
            await this.notificationUsecase.createNotification({
                userId: order.userId.toString(),
                title: "Order Status Updated",
                message: `Your order has been ${updateStatus}`,
                type: "ORDER",
                orderId: order._id.toString(),
                read: false
            });

            const user = await this.userRepository.findById(order.userId.toString());
            if (user && user.phoneNumber) {
                let message = `Hello ${user.name || 'Customer'}, your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) status has been updated to: *${updateStatus}*.\n\nThank you for shopping with KampungCetak!`;
                
                if (updateStatus === "ARTWORK_REJECTED") {
                    message = `Hello ${user.name || 'Customer'}, unfortunately the artwork for your order (ORD-${order._id.toString().slice(-6).toUpperCase()}) was REJECTED.\n\nPlease re-upload the correct picture/file via your dashboard.`;
                }
    
                WhatsAppService.sendMessage(user.phoneNumber, message).catch(err => console.error("WA Error:", err));
            }
        }

        await this.redisService.del(REDIS_KEYS.ORDERS);
        await this.redisService.del(REDIS_KEYS.ORDERS + orderId);
        if (order.userId) {
            await this.redisService.del(REDIS_KEYS.ORDERS + order.userId.toString());
        }
        
        // Sync Order status back to Task
        try {
            await this.taskRepository.updateByOrderId(orderId, { status: updateStatus as any });
            
            if (updateStatus === 'DELIVERED') {
                const { Task } = await import('../../../domain/entities/Task');
                const { FileUpload } = await import('../../../domain/entities/FileUpload');
                const { v2: cloudinary } = await import('cloudinary');
                
                cloudinary.config({
                  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dc7aun6of',
                  api_key: process.env.CLOUDINARY_API_KEY || '933197924153588',
                  api_secret: process.env.CLOUDINARY_API_SECRET || 'L8yhCjjrcV4--wTSGB-_JVY5kgg',
                });

                const tasks = await Task.find({ orderId });
                for (const task of tasks) {
                    if (task.files && task.files.length > 0) {
                        for (const file of task.files) {
                            const parts = file.url.split('/');
                            const filenameWithExtension = parts[parts.length - 1];
                            const publicId = `kampungcetak/tasks/${filenameWithExtension.split('.')[0]}`;
                            await cloudinary.uploader.destroy(publicId).catch(() => {});
                            await FileUpload.findOneAndDelete({ path: file.url, taskId: task._id });
                        }
                        task.files = [];
                        await task.save();
                    }
                }
            }
        } catch (e) {
            console.error('Failed to sync order status to task:', e);
        }

        return order;

    }

    async toggleArchiveStatus(orderId: string, isArchived: boolean) {
        const order = await this.orderRepository.updateOrder(orderId, { isArchived } as any);
        if (!order) throw new Error("Order not found");
        
        await this.redisService.del(REDIS_KEYS.ORDERS);
        await this.redisService.del(REDIS_KEYS.ORDERS + orderId);
        if (order.userId) {
            await this.redisService.del(REDIS_KEYS.ORDERS + order.userId.toString());
        }

        return order;
    }


    async getOrdersByStatus(status: "PLACED" | "IN_PROGRESS" | "PENDING_ARTWORK" | "ARTWORK_REVIEWED" | "ARTWORK_REJECTED" | "IN_DESIGN" | "PEMBETULAN" | "DONE_DESIGN" | "IN_PRODUCTION" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "FAILED") {
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
