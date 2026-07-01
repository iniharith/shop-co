/**
 * Coded by Harith
 * Kampungcetak ®
 */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import authRoutes from '../presentation/routes/auth.route';
import { apiRoutes } from '../shared/constants/api.constant';
import { notFound, errorHandler } from '../presentation/middlewares/error.middleware';
import path from 'path';
import productRoutes from '../presentation/routes/product.route';
import cartRoutes from '../presentation/routes/cart.route';
import orderRoutes from '../presentation/routes/order.route';
import adminRoutes from '../presentation/routes/admin.route';
import notificationRoutes from '../presentation/routes/notification.route';
import parcelRoutes from '../presentation/routes/parcelRoutes';
import fileUploadRoutes from '../presentation/routes/fileUploadRoutes';
import virtualFolderRoutes from '../presentation/routes/virtualFolderRoutes';
import taskRoutes from '../presentation/routes/taskRoutes';
import whatsappWebhook from '../infrastructure/services/WhatsAppWebhookService';
import userRoutes from '../presentation/routes/user.route';

dotenv.config();
const app = express();

app.use(cookieParser())
app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.options("*", cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// -------------------- util middleware-------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../public')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// -------------------- security middleware-------------------------------
app.use(mongoSanitize())

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// -------------------------  routes-------------------------------
app.use(apiRoutes.AUTH, authRoutes);
app.use('/api/user', userRoutes);
app.use(apiRoutes.PRODUCT, productRoutes);
app.use(apiRoutes.CART, cartRoutes);
app.use(apiRoutes.ORDER, orderRoutes);
app.use(apiRoutes.ADMIN, adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/folders', virtualFolderRoutes);

import chatRoutes from '../presentation/routes/chatRoutes';

// ─── Kampung Cetak: Parcel Tracking & File Upload ────────
app.use('/api/parcels', parcelRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);

// ─── WhatsApp Webhook (Meta callback verification) ───────
// Callback URL: https://admin.kampungcetak.com/api/webhooks/whatsapp
app.use('/api/webhooks/whatsapp', whatsappWebhook);

// ─── Admin Panel (served at admin.kampungcetak.com) ──────
const adminPath = path.join(__dirname, '../../admin');
app.use('/admin', express.static(adminPath));
app.get(['/admin', '/admin/*'], (_req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// -------------------------  error middleware-------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;