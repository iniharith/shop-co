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

    async getAllUsers(): Promise<IUserDocument[]> {
        return await User.find({ role: { $ne: Roles.CLIENT } }).select("-password");
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
        let user;
        const mongoose = require('mongoose');
        
        if (data.userId && mongoose.Types.ObjectId.isValid(data.userId)) {
             user = await User.findById(data.userId);
        }

        if (user) {
             data.userId = user._id;
             data.customerName = data.customerName || user.name;
        } else {
             // For external orders without a system user, remove the string userId so it doesn't break validation
             delete data.userId;
             data.customerName = data.customerName || "External Customer";
        }

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

    async deleteOrder(orderId: string): Promise<void> {
        const order = await this.orderRepository.getOrderById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }
        await this.orderRepository.deleteOrder(orderId);
    }

    async clearTestData(): Promise<void> {
        const testCustomers = await User.find({ email: { $regex: /^customer[1-3]@test\.com$/ } });
        const testCustomerIds = testCustomers.map(c => c._id);
        
        await OrderModel.deleteMany({
            $or: [
                { userId: { $in: testCustomerIds } },
                { customerName: { $regex: /^Test Customer [1-3]$/ } },
                { "address.address": "123 Jalan Test" }
            ]
        });
        
        await Parcel.deleteMany({ 
            $or: [
                { customerEmail: { $regex: /^customer[1-3]@test\.com$/ } },
                { customerName: { $regex: /^Test Customer [1-3]$/ } }
            ]
        });
        
        await FileUpload.deleteMany({ 
            $or: [
                { userId: { $in: testCustomerIds.map(id => id.toString()) } },
                { originalName: { $regex: /^Design_Test Customer [1-3]\.jpg$/ } }
            ]
        });
        
        await User.deleteMany({ 
            $or: [
                { _id: { $in: testCustomerIds } },
                { email: { $regex: /^customer[1-3]@test\.com$/ } }
            ]
        });
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
            const order = await OrderModel.create({
                userId: customer._id,
                customerName: customer.name,
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

            await Parcel.create({
                orderId: order._id.toString(),
                trackingNumber: `TRACK-${Math.floor(Math.random() * 100000)}`,
                customerPhone: "60123456789",
                customerName: customer.name,
                customerEmail: customer.email,
                courier: "J&T Express",
                status: "in_transit",
                lastStatus: "picked_up",
                events: [
                    {
                        status: "picked_up",
                        description: "Parcel picked up by courier",
                        location: "Kuala Lumpur Hub",
                        timestamp: new Date(Date.now() - 86400000)
                    },
                    {
                        status: "in_transit",
                        description: "Parcel arrived at sorting center",
                        location: "Selangor Hub",
                        timestamp: new Date()
                    }
                ],
                weight: 1.5,
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
