/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { INotification, NotificationDocument } from "../../../domain/interfaces/notification.interface";
import { NotificationModel } from "../models/notification.model";
import { BaseRepository } from "./base.repository";

export class NotificationRepository extends BaseRepository<NotificationDocument> {
    constructor() {
        super(NotificationModel);

    async createNotification(notification: any) {
        return await this.model.create(notification);
    }

    async getNotificationsByUserId(userId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return await this.model.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).limit(100).lean();
    }

    async markAllNotificationsAsRead(userId: string) {
        return await this.model.updateMany({ userId }, { $set: { read: true } });
    }
}