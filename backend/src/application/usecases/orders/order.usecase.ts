/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
import { easyParcelService, EasyParcelApiError, EasyParcelParty, EasyParcelShipment, mapEasyParcelStatus } from "../../../infrastructure/services/EasyParcelService";
import { normalizeMalaysianPhone, toMalaysianSubdivisionCode } from "../../../infrastructure/services/EasyParcelUtils";
import { emitTaskUpdated } from "../../../shared/utils/taskBroadcast";
import { notifyFileClients } from "../../../infrastructure/repositories/FileUploadRepository";
import OrderModel from "../../../infrastructure/db/models/order.model";
import { parcelRepository } from "../../../infrastructure/repositories/ParcelRepository";
import { areWhatsAppCustomerUpdatesEnabled } from "../../../infrastructure/services/CustomerUpdateSettingsService";
import { convergeOrderFromParcel } from "../../../infrastructure/services/EasyParcelTrackingSyncService";
import { clearFolderGroupCache } from "../../../presentation/routes/fileUploadRoutes";
import { computeProductPricing } from "../../../shared/pricing/product-pricing.service";
import { normalizeProductConfiguration } from "../../../shared/catalog/productConfiguration";

interface ShipmentDimensions {
    weight: number;
    width: number;
    length: number;
    height: number;
    customerPhone?: string;
    customerEmail?: string;
}

interface CreateShipmentInput extends ShipmentDimensions {
    serviceId: string;
    collectionDate: string;
}

function requiredSenderEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`EasyParcel sender configuration is missing ${name}`);
    return value;
}

function validateDimensions(input: ShipmentDimensions): void {
    for (const key of ['weight', 'width', 'length', 'height'] as const) {
        if (!Number.isFinite(input[key]) || input[key] <= 0) throw new Error(`${key} must be a positive number`);
    }
}

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

    async createOrder(address: IAddress, userId: string, customerName: string, orderNotes: string, shippingPrice?: number, courier?: string): Promise<IOrderDocument> {

        const cart = await this.cartRepository.getCartByUserId(userId);
        if (!cart || !cart.items || !cart?.items?.length) {
            throw new Error("Cart did'nt have products , add Some Products In Cart");
        }
let totalAmount = 0;
        const orderItems = [];
        const stockUpdates: Array<{ productId: string; size: string; quantity: number; productName: string }> = [];
        for (const item of cart.items) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Invalid cart quantity");

            const product = await this.productRepository.findById(item.product._id.toString());
            if (!product) throw new Error(`Product not found: ${item.product._id}`);
            if (product.catalogId && !item.configuration) throw new Error(`Product configuration is required: ${product.name}`);
            const fulfillmentSize = item.configuration?.fulfillmentSize || item.size.split('|')[0].trim();
            const sizePerProdut = product.sizes.find(e => e.size == fulfillmentSize);
            if (!sizePerProdut || sizePerProdut.stock < item.quantity) throw new Error(`Insufficient stock for product: ${product.name}`);
            stockUpdates.push({ productId: product._id.toString(), size: fulfillmentSize, quantity: item.quantity, productName: product.name });

            const normalizedConfiguration = item.configuration
                ? normalizeProductConfiguration(product, item.configuration, fulfillmentSize)
                : undefined;
            const pricing = computeProductPricing(product, item.quantity, normalizedConfiguration);
            const productPrice = pricing.lineTotal;
            orderItems.push({
                product: product._id as Types.ObjectId,
                quantity: item.quantity,
                price: productPrice,
                unitPrice: pricing.unitPrice,
                fixedPrice: pricing.fixedPrice,
                lineTotal: productPrice,
                pricingVersion: pricing.pricingVersion,
                size: item.size,
                artworkUrl: item.artworkUrl,
                configuration: normalizedConfiguration,
                configurationKey: normalizedConfiguration ? JSON.stringify(normalizedConfiguration) : item.configurationKey,
                productNameSnapshot: product.name || '',
                productDescriptionSnapshot: product.description || '',
                productCategorySnapshot: product.category || '',
            });
            totalAmount += productPrice;
        }

        const decrementedStock: typeof stockUpdates = [];
        let order: IOrderDocument;
        try {
            for (const update of stockUpdates) {
                const updatedProduct = await this.productRepository.updateProductStockBySize(update.productId, update.size, -update.quantity);
                if (!updatedProduct) throw new Error(`Insufficient stock for product: ${update.productName}`);
                decrementedStock.push(update);
            }
            const safeShippingPrice = Number.isFinite(shippingPrice) && (shippingPrice as number) >= 0 ? shippingPrice as number : 0;
            order = await this.orderRepository.createOrder({
                userId,
                customerName,
                orderNotes,
                address,
                paymentMethod: "COD",
                products: orderItems,
                totalAmount: totalAmount + safeShippingPrice,
                shippingPrice: safeShippingPrice || undefined,
                courier: courier || undefined,
            });
        } catch (error) {
            for (const update of decrementedStock.reverse()) {
                await this.productRepository.updateProductStockBySize(update.productId, update.size, update.quantity).catch(() => undefined);
            }
            throw error;
        }

        await this.redisService.del(REDIS_KEYS.ORDERS + userId);
        await this.redisService.del(REDIS_KEYS.CART + userId);
        await this.redisService.del(REDIS_KEYS.PRODUCTS);
        await this.redisService.del(REDIS_KEYS.CATEGORIES);
        await this.redisService.del(REDIS_KEYS.ADDRESS + userId);

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
            const task = await this.taskRepository.create({
                title: `Order: ${order._id.toString().slice(-6).toUpperCase()} - ${customerName}`,
                description: `Auto-generated task for Order ${order._id.toString()}.\nNotes: ${orderNotes}`,
                orderId: order._id.toString(),
                customerUsername: customerName,
                status: 'PLACED',
            });
            void emitTaskUpdated('task_created', { task });
        } catch (e) {
            console.error('Failed to auto-create task for order:', e);
        }

        await this.redisService.publish(REDIS_CHANNELS.ORDER_PLACED, 'order placed');
        return order;
    }

    async updateOrderStatus(orderId: string, updateStatus: "PLACED" | "IN_PROGRESS" | "PENDING_ARTWORK" | "ARTWORK_REVIEWED" | "ARTWORK_REJECTED" | "IN_DESIGN" | "PEMBETULAN" | "DONE_DESIGN" | "IN_PRODUCTION" | "PRINT_AWB" | "DONE_PRINTING" | "PACKAGING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "CANCELLED" | "FAILED", syncTasks = true, sourceTaskId?: string) {
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
            if (user && user.phoneNumber && await areWhatsAppCustomerUpdatesEnabled()) {
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
        // Clear folder-group cache so Production/Packaging pages see updated status immediately
        await clearFolderGroupCache().catch(() => {});
        
        // Sync Order status back to Task
        try {
            if (syncTasks) {
                await this.taskRepository.updateByOrderId(orderId, {
                    status: updateStatus as any,
                    statusUpdatedAt: new Date(),
                });
            }
            
            if (updateStatus === 'DELIVERED') {
                const { Task } = await import('../../../domain/entities/Task');
                const { FileUpload } = await import('../../../domain/entities/FileUpload');
                const { deleteFromS3 } = await import('../../../infrastructure/config/s3');
                
                const tasks = syncTasks
                    ? await Task.find({ orderId })
                    : sourceTaskId
                        ? await Task.find({ _id: sourceTaskId })
                        : [];

                // Preserve file totals on the order before S3 metadata is deleted,
                // so monthly database reports remain accurate after delivery.
                try {
                    const taskIds = tasks.map(task => task._id.toString());
                    const taskFiles = taskIds.length
                        ? await FileUpload.find({ taskId: { $in: taskIds } }).lean()
                        : [];
                    const orderFiles = await FileUpload.find({ orderId }).lean();
                    const allFiles = taskFiles.concat(orderFiles).filter(
                        (file, index, list) => list.findIndex(other => other._id.toString() === file._id.toString()) === index
                    );
                    await OrderModel.findByIdAndUpdate(orderId, {
                        fileSummarySnapshot: {
                            count: allFiles.length,
                            totalBytes: allFiles.reduce((sum, file) => sum + (Number(file.size) || 0), 0),
                            capturedAt: new Date(),
                        },
                    });
                } catch (snapshotError) {
                    console.error('Failed to persist file summary snapshot for order:', orderId, snapshotError);
                }

                for (const task of tasks) {
                    const fileUploads = await FileUpload.find({ taskId: task._id.toString() });
                    const fileUrls = new Set([
                        ...(task.files || []).map(file => file.url),
                        ...fileUploads.map(file => file.path),
                    ].filter(Boolean));

                    for (const fileUrl of fileUrls) {
                        await deleteFromS3(fileUrl).catch(() => {});
                    }
                    await FileUpload.deleteMany({ taskId: task._id.toString() });
                    task.files = [];
                    await task.save();
                }
                void notifyFileClients();
            }

            if (syncTasks) {
                const updatedTasks = await this.taskRepository.findByOrderId(orderId);
                updatedTasks.forEach(task => void emitTaskUpdated('task_updated', { task }));
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


    async getOrdersByStatus(status: "PLACED" | "IN_PROGRESS" | "PENDING_ARTWORK" | "ARTWORK_REVIEWED" | "ARTWORK_REJECTED" | "IN_DESIGN" | "PEMBETULAN" | "DONE_DESIGN" | "IN_PRODUCTION" | "PRINT_AWB" | "DONE_PRINTING" | "PACKAGING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "CANCELLED" | "FAILED") {
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

    async getShippingQuotations(orderId: string, input: ShipmentDimensions): Promise<any[]> {
        validateDimensions(input);
        const order = await this.getShippableOrder(orderId);
        return easyParcelService.getQuotations([this.buildShipment(order, input)]);
    }

    async createShipment(orderId: string, input: CreateShipmentInput): Promise<IOrderDocument> {
        validateDimensions(input);
        if (!input.serviceId?.trim()) throw new Error('serviceId is required');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.collectionDate || '')) {
            throw new Error('collectionDate must use YYYY-MM-DD');
        }
        const order = await this.getShippableOrder(orderId);
        if (order.easyparcelShipmentId || order.easyparcelAwb) throw new Error('Shipment already created for this order');
        const shipment = this.buildShipment(order, input);

        const locked = await OrderModel.findOneAndUpdate(
            {
                _id: orderId,
                paymentStatus: 'PAID',
                orderStatus: { $in: ['DONE_PRINTING', 'PACKAGING'] },
                easyparcelShipmentId: { $exists: false },
                $or: [
                    { easyparcelBookingStatus: { $exists: false } },
                    { easyparcelBookingStatus: 'failed' },
                ],
            },
            {
                $set: {
                    easyparcelBookingStatus: 'submitted',
                    easyparcelServiceId: input.serviceId.trim(),
                    shippingWeight: input.weight,
                    shippingDimensions: { width: input.width, length: input.length, height: input.height },
                    shippingCollectionDate: new Date(`${input.collectionDate}T00:00:00.000Z`),
                    shippingCustomerPhone: shipment.receiver.phone.number,
                    shippingCustomerEmail: shipment.receiver.email,
                }
            },
            { new: true }
        );
        if (!locked) throw new Error('Shipment is already being submitted or the order is no longer shippable');

        let result;
        try {
            result = await easyParcelService.submitOrder({
                ...shipment,
                serviceId: input.serviceId.trim(),
                collectionDate: input.collectionDate,
                reference: orderId,
                itemDescription: 'Printed Products',
                itemValue: order.totalAmount,
                currency: 'MYR',
            });
        } catch (error) {
            const definitelyRejected = error instanceof EasyParcelApiError && !error.ambiguous;
            await OrderModel.findByIdAndUpdate(orderId, {
                $set: { easyparcelBookingStatus: definitelyRejected ? 'failed' : 'submitted' }
            });
            if (!definitelyRejected) {
                throw new Error('EasyParcel submission result is uncertain. Reconcile the shipment before retrying to avoid a duplicate charge.');
            }
            throw error;
        }

        const bookingStatus = result.awbNumber ? 'booked' : 'awb_pending';
        let updatedOrder: IOrderDocument | null = null;
        try {
            const orderUpdate: any = {
                easyparcelOrderNo: result.orderNumber,
                easyparcelShipmentId: result.shipmentNumber,
                easyparcelBookingStatus: bookingStatus,
                easyparcelAwb: result.awbNumber || '',
                trackingNumber: result.awbNumber || '',
                awbUrl: result.awbUrl,
                awbUrlsByFormat: result.awbUrlsByFormat,
                trackingUrl: result.trackingUrl,
                courier: result.courier,
                shippingPrice: result.shippingPrice,
            };
            updatedOrder = await this.orderRepository.updateOrder(orderId, orderUpdate);
            const sender = this.buildSender();
            const receiver = this.buildReceiver(order, input);
            await parcelRepository.upsertByOrderId(orderId, {
                trackingNumber: result.awbNumber || undefined,
                easyparcelOrderNumber: result.orderNumber,
                easyparcelShipmentId: result.shipmentNumber,
                serviceId: input.serviceId,
                courier: result.courier || 'unknown',
                service: result.service,
                awbUrl: result.awbUrl,
                awbUrlsByFormat: result.awbUrlsByFormat,
                trackingUrl: result.trackingUrl,
                bookingStatus,
                collectionDate: new Date(`${input.collectionDate}T00:00:00.000Z`),
                shippingPrice: result.shippingPrice,
                currency: result.currency || 'MYR',
                dimensions: { width: input.width, length: input.length, height: input.height },
                weight: input.weight,
                customerName: order.customerName,
                customerPhone: receiver.phone.number,
                customerEmail: receiver.email,
                senderName: sender.name,
                senderPhone: sender.phone.number,
                senderAddress: [sender.address1, sender.address2].filter(Boolean).join(', '),
                recipientAddress: [receiver.address1, receiver.address2].filter(Boolean).join(', '),
                status: 'pending',
                lastStatus: '',
            });
        } catch (error) {
            console.error('EasyParcel shipment booked but local persistence failed:', error);
            await OrderModel.findByIdAndUpdate(orderId, {
                $set: {
                    easyparcelOrderNo: result.orderNumber,
                    easyparcelShipmentId: result.shipmentNumber,
                    easyparcelBookingStatus: 'submitted',
                    easyparcelAwb: result.awbNumber || '',
                    trackingNumber: result.awbNumber || '',
                    awbUrl: result.awbUrl,
                    awbUrlsByFormat: result.awbUrlsByFormat,
                    trackingUrl: result.trackingUrl,
                    courier: result.courier,
                },
            }).catch(() => undefined);
            throw new Error(`EasyParcel booked shipment ${result.shipmentNumber}, but local tracking sync needs repair. Use Reconcile and do not create another shipment.`);
        }
        await this.invalidateOrderCaches(order).catch((error) => console.error('Failed to invalidate order caches:', error));
        return updatedOrder as IOrderDocument;
    }

    async refreshShipping(orderId: string): Promise<IOrderDocument> {
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (!order.easyparcelShipmentId) throw new Error('No EasyParcel shipment exists for this order');
        const existingParcel = await parcelRepository.findByShipmentId(order.easyparcelShipmentId);
        if (!existingParcel) return this.reconcileSubmittedShipment(orderId, order.easyparcelShipmentId);
        const requestedAt = new Date();
        const shipment = await easyParcelService.getShipmentDetails(order.easyparcelShipmentId);
        const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
        const update: any = {
            easyparcelBookingStatus: bookingStatus,
            easyparcelAwb: shipment.awbNumber || '',
            trackingNumber: shipment.awbNumber || '',
            awbUrl: shipment.awbUrl,
            awbUrlsByFormat: shipment.awbUrlsByFormat,
            trackingUrl: shipment.trackingUrl,
            courier: shipment.courier,
        };
        await this.orderRepository.updateOrder(orderId, update);
        if (existingParcel) {
            await parcelRepository.update(existingParcel._id.toString(), {
                trackingNumber: shipment.awbNumber || undefined,
                bookingStatus,
                awbUrl: shipment.awbUrl,
                awbUrlsByFormat: shipment.awbUrlsByFormat,
                trackingUrl: shipment.trackingUrl,
                courier: shipment.courier || existingParcel.courier,
                service: shipment.service,
            });
        }
        if (shipment.statusCode !== undefined) {
            const applied = await parcelRepository.updateProviderStatus(existingParcel._id.toString(), requestedAt, {
                shipmentStatusCode: shipment.statusCode,
                status: mapEasyParcelStatus(shipment.statusCode),
            });
            const current = applied || await parcelRepository.findById(existingParcel._id.toString());
            if (current) await convergeOrderFromParcel(current);
        }
        await this.invalidateOrderCaches(order);
        return (await OrderModel.findById(orderId)) as IOrderDocument;
    }

    async reconcileSubmittedShipment(orderId: string, shipmentNumber: string): Promise<IOrderDocument> {
        if (!/^ES-[A-Z0-9-]+$/i.test(shipmentNumber || '')) throw new Error('A valid EasyParcel shipment number is required');
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.easyparcelShipmentId && order.easyparcelShipmentId !== shipmentNumber) {
            throw new Error('This order is already linked to a different EasyParcel shipment');
        }
        if (!order.easyparcelShipmentId && order.easyparcelBookingStatus !== 'submitted') {
            throw new Error('Only an uncertain submitted shipment can be reconciled manually');
        }

        const linkedOrder = await OrderModel.findOne({ easyparcelShipmentId: shipmentNumber, _id: { $ne: orderId } }).select('_id').lean();
        if (linkedOrder) throw new Error('This EasyParcel shipment is already linked to another order');
        const requestedAt = new Date();
        const shipment = await easyParcelService.getShipmentDetails(shipmentNumber);
        const reference = shipment.raw?.shipment_details?.reference;
        if (reference !== orderId) {
            throw new Error('EasyParcel shipment reference does not match this order');
        }
        const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
        await this.orderRepository.updateOrder(orderId, {
            easyparcelOrderNo: shipment.raw?.order_number || order.easyparcelOrderNo,
            easyparcelShipmentId: shipment.shipmentNumber,
            easyparcelBookingStatus: bookingStatus,
            easyparcelAwb: shipment.awbNumber || '',
            trackingNumber: shipment.awbNumber || '',
            awbUrl: shipment.awbUrl,
            awbUrlsByFormat: shipment.awbUrlsByFormat,
            trackingUrl: shipment.trackingUrl,
            courier: shipment.courier,
            shippingPrice: Number(shipment.raw?.pricing?.total_price || shipment.raw?.pricing?.shipment_price) || order.shippingPrice,
        });

        const user = order.userId as any;
        const raw = shipment.raw || {};
        const reconciledParcel = await parcelRepository.upsertByOrderId(orderId, {
            trackingNumber: shipment.awbNumber || undefined,
            easyparcelShipmentId: shipment.shipmentNumber,
            easyparcelOrderNumber: raw.order_number || order.easyparcelOrderNo,
            serviceId: raw.courier?.service_id || order.easyparcelServiceId,
            courier: shipment.courier || order.courier || 'unknown',
            service: shipment.service,
            awbUrl: shipment.awbUrl,
            awbUrlsByFormat: shipment.awbUrlsByFormat,
            trackingUrl: shipment.trackingUrl,
            bookingStatus,
            collectionDate: order.shippingCollectionDate || (raw.shipment_details?.coll_date ? new Date(raw.shipment_details.coll_date) : undefined),
            shippingPrice: Number(raw.pricing?.total_price || raw.pricing?.shipment_price) || order.shippingPrice,
            currency: raw.pricing?.currency_code || 'MYR',
            dimensions: order.shippingDimensions || {
                width: Number(raw.shipment_details?.width) || 0,
                length: Number(raw.shipment_details?.length) || 0,
                height: Number(raw.shipment_details?.height) || 0,
            },
            weight: order.shippingWeight || Number(raw.shipment_details?.weight) || 1,
            customerName: order.customerName,
            customerPhone: order.shippingCustomerPhone || raw.receiver?.contact || user?.phoneNumber || 'Unavailable',
            customerEmail: order.shippingCustomerEmail || raw.receiver?.email || user?.email,
            senderName: raw.sender?.name || process.env.EASYPARCEL_SENDER_NAME || 'Kampung Cetak',
            senderPhone: raw.sender?.contact || process.env.EASYPARCEL_SENDER_PHONE || '',
            senderAddress: raw.sender?.address1 || process.env.EASYPARCEL_SENDER_ADDRESS_1 || '',
            recipientAddress: raw.receiver?.address1 || order.address?.street || '',
        });
        if (shipment.statusCode !== undefined) {
            const applied = await parcelRepository.updateProviderStatus(reconciledParcel._id.toString(), requestedAt, {
                shipmentStatusCode: shipment.statusCode,
                status: mapEasyParcelStatus(shipment.statusCode),
            });
            const current = applied || await parcelRepository.findById(reconciledParcel._id.toString());
            if (current) await convergeOrderFromParcel(current);
        }
        await this.invalidateOrderCaches(order);
        return (await OrderModel.findById(orderId)) as IOrderDocument;
    }

    async getTracking(orderId: string, requesterUserId: string, requesterRole?: string): Promise<any> {
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        const staffRoles = ['admin', 'sysadmin', 'boss', 'production', 'packaging'];
        const ownerId = (order.userId as any)?._id?.toString() || order.userId?.toString();
        if (!staffRoles.includes(requesterRole || '') && ownerId !== requesterUserId) {
            throw new Error('Order not found');
        }

        const parcel = (await parcelRepository.findByOrderId(orderId))[0];
        if (!parcel) return { parcel: null, tracking: [] };
        let tracking: any[] = [];
        if (parcel.trackingNumber) {
            try {
                tracking = await easyParcelService.trackParcels([parcel.trackingNumber]);
            } catch (error) {
                console.error('Live EasyParcel tracking unavailable; returning stored parcel status:', error);
            }
        }
        return {
            parcel: {
                _id: parcel._id,
                orderId: parcel.orderId,
                trackingNumber: parcel.trackingNumber,
                courier: parcel.courier,
                status: parcel.status,
                events: parcel.events,
                bookingStatus: parcel.bookingStatus,
                trackingUrl: parcel.trackingUrl,
                updatedAt: parcel.updatedAt,
            },
            tracking,
        };
    }

    async processEasyParcelWebhook(payload: any): Promise<boolean> {
        const topic = String(payload?.topic || payload?.event || '');
        if (!['shipment.awb.update', 'shipment.status.update', 'shipment.tracking.update'].includes(topic)) return false;
        const data = payload?.data || payload?.payload || payload || {};
        const shipmentNumber = String(data.shipment_number || '');
        if (!shipmentNumber) return false;
        const parcel = await parcelRepository.findByShipmentId(shipmentNumber);
        if (!parcel) return false;

        const awb = data.awb_number || data.awb || parcel.trackingNumber;
        const statusCode = Number(data.latest_shipment_status_code ?? data.status_code ?? data.shipment_status_code);
        const hasStatusCode = Number.isFinite(statusCode);
        const newStatus = hasStatusCode ? mapEasyParcelStatus(statusCode) : parcel.status;
        const statusChanged = parcel.shipmentStatusCode === undefined
            ? newStatus !== parcel.status
            : hasStatusCode && statusCode !== parcel.shipmentStatusCode;
        const eventSource = data.status_log || data.events || data.tracking_events;
        const incomingEvents = Array.isArray(eventSource)
            ? eventSource
            : eventSource && typeof eventSource === 'object'
                ? Object.values(eventSource)
                : [];
        const rawEvents = incomingEvents.length ? incomingEvents : [...(parcel.events || [])];
        const providerTimestampValues = [data.event_date, data.timestamp, payload?.event_date, payload?.timestamp]
            .concat(incomingEvents.map((event: any) => event?.event_date || event?.timestamp || event?.datetime))
            .map((value) => value ? new Date(value) : null)
            .filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())));
        const providerStatusUpdatedAt = providerTimestampValues.length
            ? new Date(Math.max(...providerTimestampValues.map((value) => value.getTime())))
            : undefined;
        const events = rawEvents.map((event: any) => ({
            status: String(event.shipment_status_code ?? event.status ?? event.status_name ?? event.status_code ?? ''),
            description: String(event.tracking_status || event.description || event.message || ''),
            location: String(event.location || ''),
            timestamp: new Date(event.event_date || event.timestamp || event.datetime || Date.now()),
        }));
        if (!eventSource && hasStatusCode && statusChanged) {
            events.push({
                status: String(statusCode),
                description: String(data.latest_tracking_status || data.shipment_status || ''),
                location: String(data.location || ''),
                timestamp: new Date(data.event_date || data.timestamp || Date.now()),
            });
        }
        const parcelUpdate = {
            trackingNumber: awb || undefined,
            bookingStatus: awb ? 'booked' : parcel.bookingStatus,
            awbUrl: data.awb_url || parcel.awbUrl,
            trackingUrl: data.tracking_url || parcel.trackingUrl,
        };
        let statusApplied = false;
        let updatedParcel;
        if (hasStatusCode && providerStatusUpdatedAt) {
            updatedParcel = await parcelRepository.updateProviderStatus(parcel._id.toString(), providerStatusUpdatedAt, {
                ...parcelUpdate,
                lastStatus: statusChanged ? parcel.status : parcel.lastStatus,
                status: newStatus,
                shipmentStatusCode: statusCode,
                events,
            });
            statusApplied = Boolean(updatedParcel);
        }
        if (!updatedParcel) updatedParcel = await parcelRepository.update(parcel._id.toString(), parcelUpdate);
        const appliedStatusChanged = statusChanged && statusApplied;
        const orderUpdate: any = {
            easyparcelAwb: awb || '',
            trackingNumber: awb || '',
            easyparcelBookingStatus: awb ? 'booked' : parcel.bookingStatus,
            awbUrl: data.awb_url || parcel.awbUrl,
            trackingUrl: data.tracking_url || parcel.trackingUrl,
        };
        await OrderModel.findByIdAndUpdate(parcel.orderId, { $set: orderUpdate });
        if (updatedParcel) await convergeOrderFromParcel(updatedParcel);

        if (appliedStatusChanged && updatedParcel?.customerPhone && await areWhatsAppCustomerUpdatesEnabled()) {
            await WhatsAppService.sendMessage(
                updatedParcel.customerPhone,
                `Your order ${updatedParcel.orderId.slice(-8).toUpperCase()} is now ${newStatus.replace(/_/g, ' ')}. Tracking: ${awb || 'pending'}`
            );
        }
        await this.redisService.del(REDIS_KEYS.ORDERS);
        await this.redisService.del(REDIS_KEYS.ORDERS + parcel.orderId);
        const linkedOrder = await OrderModel.findById(parcel.orderId).select('userId').lean();
        if (linkedOrder?.userId) await this.redisService.del(REDIS_KEYS.ORDERS + linkedOrder.userId.toString());
        return true;
    }

    private async getShippableOrder(orderId: string): Promise<IOrderDocument> {
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.paymentStatus !== 'PAID') throw new Error('Order must be paid before shipping');
        if (!['DONE_PRINTING', 'PACKAGING'].includes(order.orderStatus)) {
            throw new Error('Order must be done printing or in packaging before shipping');
        }
        return order;
    }

    private buildShipment(order: IOrderDocument, input: ShipmentDimensions): EasyParcelShipment {
        return {
            sender: this.buildSender(),
            receiver: this.buildReceiver(order, input),
            weight: input.weight,
            width: input.width,
            length: input.length,
            height: input.height,
            parcelValue: order.totalAmount,
        };
    }

    private buildSender(): EasyParcelParty {
        const countryCode = (process.env.EASYPARCEL_SENDER_COUNTRY_CODE?.trim() || 'MY').toUpperCase();
        const subdivision = requiredSenderEnv('EASYPARCEL_SENDER_SUBDIVISION_CODE');
        return {
            name: requiredSenderEnv('EASYPARCEL_SENDER_NAME'),
            company: process.env.EASYPARCEL_SENDER_COMPANY?.trim() || undefined,
            phone: normalizeMalaysianPhone(requiredSenderEnv('EASYPARCEL_SENDER_PHONE')),
            email: process.env.EASYPARCEL_SENDER_EMAIL?.trim() || undefined,
            address1: requiredSenderEnv('EASYPARCEL_SENDER_ADDRESS_1'),
            address2: process.env.EASYPARCEL_SENDER_ADDRESS_2?.trim() || undefined,
            postcode: requiredSenderEnv('EASYPARCEL_SENDER_POSTCODE'),
            city: requiredSenderEnv('EASYPARCEL_SENDER_CITY'),
            subdivisionCode: countryCode === 'MY' ? toMalaysianSubdivisionCode(subdivision) : subdivision,
            countryCode,
        };
    }

    private buildReceiver(order: IOrderDocument, input: ShipmentDimensions): EasyParcelParty {
        const user = order.userId as any;
        const phone = input.customerPhone?.trim() || user?.phoneNumber || '';
        const email = input.customerEmail?.trim() || user?.email || undefined;
        const country = (order.address?.country || 'MY').trim();
        const countryCode = /^(my|malaysia)$/i.test(country) ? 'MY' : country.toUpperCase();
        if (countryCode !== 'MY') throw new Error('Only Malaysian receiver addresses are currently supported');
        const state = order.address?.state?.trim() || order.address?.address?.trim() || '';
        const legacyAddress = order.address?.address?.trim();
        let address2 = legacyAddress && legacyAddress !== order.address?.street ? legacyAddress : undefined;
        if (address2) {
            try {
                toMalaysianSubdivisionCode(address2);
                address2 = undefined;
            } catch {
                // Legacy checkout records sometimes stored the state in `address`.
            }
        }
        return {
            name: order.customerName,
            phone: normalizeMalaysianPhone(phone),
            email,
            address1: order.address?.street,
            address2,
            postcode: order.address?.postalCode,
            city: order.address?.city,
            subdivisionCode: toMalaysianSubdivisionCode(state),
            countryCode,
        };
    }

    async getPublicShippingQuotations(input: {
        postalCode: string;
        state: string;
        country?: string;
        weight: number;
        width: number;
        length: number;
        height: number;
    }): Promise<any[]> {
        if (!input.postalCode?.trim()) throw new Error('postalCode is required');
        if (!input.state?.trim()) throw new Error('state is required');
        if (!Number.isFinite(input.weight) || input.weight <= 0) throw new Error('weight must be a positive number');
        if (!Number.isFinite(input.width) || input.width <= 0) throw new Error('width must be a positive number');
        if (!Number.isFinite(input.length) || input.length <= 0) throw new Error('length must be a positive number');
        if (!Number.isFinite(input.height) || input.height <= 0) throw new Error('height must be a positive number');

        const status = await easyParcelService.getConnectionStatus().catch(() => null);
        if (!status?.connected) {
            throw new Error('Shipping calculation is unavailable — EasyParcel needs to be reconnected. Please contact support.');
        }

        const country = (input.country || 'MY').trim();
        const countryCode = /^(my|malaysia)$/i.test(country) ? 'MY' : country.toUpperCase();
        if (countryCode !== 'MY') throw new Error('Only Malaysian addresses are currently supported');

        let sender: EasyParcelParty;
        try {
            sender = this.buildSender();
        } catch (e: any) {
            throw new Error('Shipping calculation is unavailable — sender configuration is missing.');
        }

        let subdivisionCode: string;
        try {
            subdivisionCode = toMalaysianSubdivisionCode(input.state.trim());
        } catch {
            throw new Error(`Invalid state: ${input.state}`);
        }

        const receiver: EasyParcelParty = {
            name: 'Customer',
            phone: { countryCode: 'MY', number: '000000000' },
            address1: input.postalCode,
            postcode: input.postalCode.trim(),
            city: '',
            subdivisionCode,
            countryCode,
        };

        const shipment: EasyParcelShipment = {
            sender,
            receiver,
            weight: input.weight,
            width: input.width,
            length: input.length,
            height: input.height,
        };

        const timeoutMs = 15_000;
        return Promise.race([
            easyParcelService.getQuotations([shipment]),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Shipping rate request timed out')), timeoutMs)
            ),
        ]);
    }

    private async invalidateOrderCaches(order: IOrderDocument): Promise<void> {
        await this.redisService.del(REDIS_KEYS.ORDERS);
        await this.redisService.del(REDIS_KEYS.ORDERS + order._id.toString());
        const userId = (order.userId as any)?._id || order.userId;
        if (userId) await this.redisService.del(REDIS_KEYS.ORDERS + userId.toString());
    }
}
