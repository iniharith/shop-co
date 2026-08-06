/**
 * Coded by Harith
 * Kampungcetak ®
 */
import '../instrumentation';
import express, { NextFunction, Request, Response } from 'express';
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
import toolsRoutes from '../presentation/routes/toolsRoutes';
import whatsappWebhook from '../infrastructure/services/WhatsAppWebhookService';
import userRoutes from '../presentation/routes/user.route';
import sysadminRoutes from '../presentation/routes/sysadminRoutes';
import chatRoutes from '../presentation/routes/chatRoutes';
import appRoutes from '../presentation/routes/appRoutes';
import webhookRouter from '../presentation/routes/webhook.route';
import projectRoutes from '../presentation/routes/projectRoutes';
import auditRoutes from '../presentation/routes/auditRoutes';
import easyParcelRoutes from '../presentation/routes/easyParcelRoutes';
import webVitalsRoutes from '../presentation/routes/webVitalsRoutes';
import { auditMiddleware } from '../presentation/middlewares/audit.middleware';
import { bandwidthMiddleware } from '../shared/utils/bandwidthTracker';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

dotenv.config();
const app = express();

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Cache-Control",
        "Pragma",
        "X-Request-ID"
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range", "X-Request-ID"],
    maxAge: 86400,
};

app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingId = req.get('X-Request-ID');
    req.requestId = incomingId && /^[A-Za-z0-9._-]{1,100}$/.test(incomingId)
        ? incomingId
        : randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
app.use(cors(corsOptions));
app.use(bandwidthMiddleware);
app.use(cookieParser());

// -------------------- util middleware-------------------------------
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.use(express.static(path.join(__dirname, '../../public')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// -------------------- security middleware-------------------------------
app.use(mongoSanitize())
app.use(auditMiddleware);

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// -------------------------  routes-------------------------------
app.use(apiRoutes.AUTH, authRoutes);
app.use('/api/user', userRoutes);
app.use(apiRoutes.PRODUCT, productRoutes);
app.use(apiRoutes.CART, cartRoutes);
app.use(apiRoutes.ORDER, orderRoutes);
app.use('/api/webhooks', webhookRouter);
app.use('/api/easyparcel', easyParcelRoutes);
app.use(apiRoutes.ADMIN, adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/folders', virtualFolderRoutes);

// ─── Kampung Cetak: Parcel Tracking & File Upload ────────
app.use('/api/parcels', parcelRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sysadmin', sysadminRoutes);
app.use('/api/web-vitals', webVitalsRoutes);

// ─── WhatsApp Webhook (Meta callback verification) ───────
// Callback URL: https://admin.kampungcetak.com/api/webhooks/whatsapp
app.use('/api/webhooks/whatsapp', whatsappWebhook);

// Mobile App Routes
app.use('/api/app', appRoutes);

// ─── Admin Panel (served at admin.kampungcetak.com) ──────
const adminPath = path.join(__dirname, '../../admin');
app.use('/admin', express.static(adminPath));
app.get(['/admin', '/admin/*'], (_req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
});

app.get(['/health', '/health/live'], (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/health/ready', (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;

    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ready' : 'not_ready',
        checks: {
            database: databaseReady ? 'up' : 'down',
        },
    });
});

// -------------------------  error middleware-------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
