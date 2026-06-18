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
import bcrypt from "bcryptjs";
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

    async createUser(data: any): Promise<IUserDocument> {
        const password = data.password 
            ? await bcrypt.hash(data.password, 10) 
            : await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        
        return await User.create({
            ...data,
            password
        });
    }

    async updateUser(userId: string, data: any): Promise<IUserDocument | null> {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        return await User.findByIdAndUpdate(userId, data, { new: true });
    }

    async createManualOrder(data: any): Promise<IOrderDocument> {
        return await OrderModel.create(data);
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

    async seedTestData(): Promise<void> {
        // Create 3 dummy customers
        const customers = [];
        for (let i = 1; i <= 3; i++) {
            let u = await User.findOne({ email: `customer${i}@test.com` });
            if (!u) {
                u = await User.create({
                    name: `Test Customer ${i}`,
                    email: `customer${i}@test.com`,
                    password: "password123",
                    role: Roles.CLIENT,
                    verified: true
                });
            }
            customers.push(u);
        }

        // Create dummy orders for these customers
        for (const customer of customers) {
            await OrderModel.create({
                userId: customer._id,
                products: [], // empty or add dummy products if needed
                totalAmount: Math.floor(Math.random() * 500) + 50,
                paymentMethod: "ONLINE",
                paymentStatus: "PAID",
                orderStatus: "PLACED",
                address: {
                    address: "123 Jalan Test",
                    street: "Test Street",
                    city: "Kuala Lumpur",
                    postalCode: "50000",
                    country: "Malaysia"
                }
            });

            // Create some file uploads for this customer
            await FileUpload.create({
                userId: customer._id.toString(),
                filename: `test-artwork-${customer._id}.jpg`,
                originalName: `Design_${customer.name}.jpg`,
                mimetype: "image/jpeg",
                size: 2048000,
                path: "https://via.placeholder.com/500", // dummy URL
                adminReviewed: false
            });
        }
    }

}

export default new AdminUsecase();
