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
import deliveryBoyRoutes from '../presentation/routes/deliveryBoy.route';
import adminRoutes from '../presentation/routes/admin.route';
import notificationRoutes from '../presentation/routes/notification.route';
import parcelRoutes from '../presentation/routes/parcel.route';
import fileStoreRoutes from '../presentation/routes/filestore.route';

dotenv.config();
const app = express();

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
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
        "Pragma"
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(cookieParser());

// -------------------- util middleware-------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../public')));

// -------------------- security middleware-------------------------------
app.use(mongoSanitize())

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// -------------------------  routes-------------------------------
app.use(apiRoutes.AUTH, authRoutes);
app.use(apiRoutes.PRODUCT, productRoutes);
app.use(apiRoutes.CART, cartRoutes);
app.use(apiRoutes.ORDER, orderRoutes);
app.use(apiRoutes.DELIVERY_BOY, deliveryBoyRoutes);
app.use(apiRoutes.ADMIN, adminRoutes);
app.use(apiRoutes.NOTIFICATION, notificationRoutes);
app.use(apiRoutes.PARCEL, parcelRoutes);
app.use(apiRoutes.FILESTORE, fileStoreRoutes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// -------------------------  error middleware-------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;