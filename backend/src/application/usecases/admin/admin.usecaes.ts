import IJwtService from "../../../domain/interfaces/jwt.ineterface";
import { UserRepository } from "../../../infrastructure/db/repositories/user.repository";
import { IUserDocument } from "../../../domain/interfaces/user.interface";
import JwtService from "../../../shared/utils/jwt";
import { Roles } from "../../../domain/types/user.type";
import { OrderRepository } from "../../../infrastructure/db/repositories/order.repository";
import { IOrderDocument } from "../../../domain/interfaces/order.interface";
import { NotificationRepository } from "../../../infrastructure/db/repositories/notification.repository";
import { NotificationUsecase } from "../notification/notification.usecase";
import User from "../../../infrastructure/db/models/user.model";
import OrderModel from "../../../infrastructure/db/models/order.model";
import { FileUpload } from "../../../domain/entities/FileUpload";
import { Parcel } from "../../../domain/entities/Parcel";
export class AdminUsecase {
    private readonly userRepository: UserRepository;
    private readonly jwtService: IJwtService;
    private readonly orderRepository: OrderRepository;
    private readonly notificationRepository: NotificationRepository;
    private readonly notificationUsecase: NotificationUsecase
    constructor() {
        this.userRepository = new UserRepository();
        this.jwtService = new JwtService();
        this.orderRepository = new OrderRepository();
        this.notificationRepository = new NotificationRepository();
        this.notificationUsecase = new NotificationUsecase();
    }

    async getUsersByRole(role: Roles): Promise<IUserDocument[]> {
        return await this.userRepository.getUsersByRole(role);
    }

    async verifyUser(userId: string, status: boolean): Promise<IUserDocument | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        user.verified = status;
        // WIREUP: socket io to send notification to the user
        await this.notificationUsecase.createNotification({
            userId: user._id.toString(),
            title: "User Verified",
            message: "Your account has been verified",
            type: "VERIFICATION",
            read: false
        })
        return await this.userRepository.updateById(userId, user);
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        await this.userRepository.deleteById(userId);
    }

    async adminLogin(email: string, password: string): Promise<{ user: IUserDocument, accessToken: string, refreshToken: string }> {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (email !== adminEmail || password !== adminPassword) {
            throw new Error("Invalid email or password");
        }
        let user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Auto-create admin user on first login
            user = await this.userRepository.create({
                name: "Super Admin",
                email: email,
                password: password, // will be hashed by mongoose hook
                role: Roles.ADMIN,
                verified: true,
                phone: "0000000000"
            } as any);
        }
        const accessToken = this.jwtService.generateAccessToken({ userId: user._id });
        const refreshToken = this.jwtService.generateRefreshToken({ userId: user._id });
        return { user, accessToken, refreshToken };
    }

    async getOrders(): Promise<IOrderDocument[]> {
        return await this.orderRepository.getOrders();
    }

    async getOrdersByDeliveryBoy(deliveryBoyId: string): Promise<IOrderDocument[]> {
        return await this.orderRepository.getOderByDeliveryBoy(deliveryBoyId);
    }

    async seedTestData(userId?: string): Promise<void> {
        if (!userId) {
            throw new Error("Admin User ID is required to generate Test Drive data");
        }

        const adminUser = await User.findById(userId);
        if (!adminUser) {
            throw new Error("Admin user not found");
        }

        // 1. Create a highly realistic Test Order
        const testOrder = await OrderModel.create({
            userId: adminUser._id,
            products: [{
                productId: "demo-product-123",
                name: "Premium Business Cards",
                quantity: 500,
                price: 150
            }],
            totalAmount: 150,
            paymentMethod: "ONLINE",
            paymentStatus: "PAID",
            orderStatus: "PLACED",
            address: {
                address: "Test Drive Ave, Suite 100",
                street: "Demo Street",
                city: "Kuala Lumpur",
                postalCode: "50000",
                country: "Malaysia"
            }
        });

        // 2. Fire Real-time Notification for Artwork
        await this.notificationUsecase.createNotification({
            userId: adminUser._id.toString(),
            title: "Action Required: Upload Artwork",
            message: `Please upload your design artwork for Test Order #${testOrder._id.toString().substring(0, 8).toUpperCase()}.`,
            type: "ORDER",
            orderId: testOrder._id.toString(),
            read: false
        });

        // 3. Create a Dummy Parcel Tracking Record
        const trackingNumber = `TRK-TEST-${Math.floor(Math.random() * 90000) + 10000}`;
        await Parcel.create({
            orderId: testOrder._id.toString(),
            trackingNumber: trackingNumber,
            customerPhone: adminUser.phoneNumber || "60123456789",
            customerName: adminUser.name,
            customerEmail: adminUser.email,
            courier: "J&T Express",
            status: "in_transit",
            lastStatus: "picked_up",
            events: [{
                status: "picked_up",
                description: "Parcel picked up by courier",
                location: "Selangor Hub",
                timestamp: new Date(Date.now() - 3600000) // 1 hour ago
            }, {
                status: "in_transit",
                description: "Parcel is in transit to destination facility",
                location: "Kuala Lumpur Hub",
                timestamp: new Date()
            }],
            weight: 1.5,
            senderName: "Kampung Cetak (Demo)",
            senderPhone: "6031234567",
            senderAddress: "HQ Print Shop",
            recipientAddress: "Test Drive Ave, Suite 100",
        });

        // 4. Fire Real-time Notification for Tracking
        await this.notificationUsecase.createNotification({
            userId: adminUser._id.toString(),
            title: "Order Shipped!",
            message: `Your Test Order #${testOrder._id.toString().substring(0, 8).toUpperCase()} is now in transit. Tracking: ${trackingNumber}`,
            type: "DELIVERY",
            orderId: testOrder._id.toString(),
            read: false
        });

        // Optional: Create a dummy FileUpload to simulate an already uploaded file for UI testing
        await FileUpload.create({
            userId: adminUser._id.toString(),
            orderId: testOrder._id.toString(),
            filename: `demo-artwork-${testOrder._id}.pdf`,
            originalName: `BusinessCard_Demo.pdf`,
            mimetype: "application/pdf",
            size: 4500000,
            path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            adminReviewed: false
        });
    }

}

export default new AdminUsecase();
