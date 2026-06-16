"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const morgan_1 = __importDefault(require("morgan"));
const auth_route_1 = __importDefault(require("../presentation/routes/auth.route"));
const api_constant_1 = require("../shared/constants/api.constant");
const error_middleware_1 = require("../presentation/middlewares/error.middleware");
const path_1 = __importDefault(require("path"));
const product_route_1 = __importDefault(require("../presentation/routes/product.route"));
const cart_route_1 = __importDefault(require("../presentation/routes/cart.route"));
const order_route_1 = __importDefault(require("../presentation/routes/order.route"));
const deliveryBoy_route_1 = __importDefault(require("../presentation/routes/deliveryBoy.route"));
const admin_route_1 = __importDefault(require("../presentation/routes/admin.route"));
const notification_route_1 = __importDefault(require("../presentation/routes/notification.route"));
const parcelRoutes_1 = __importDefault(require("../presentation/routes/parcelRoutes"));
const fileUploadRoutes_1 = __importDefault(require("../presentation/routes/fileUploadRoutes"));
const WhatsAppWebhookService_1 = __importDefault(require("../infrastructure/services/WhatsAppWebhookService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", (0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// -------------------- util middleware-------------------------------
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
// -------------------- security middleware-------------------------------
app.use((0, express_mongo_sanitize_1.default)());
if (process.env.NODE_ENV === "development")
    app.use((0, morgan_1.default)("dev"));
// -------------------------  routes-------------------------------
app.use(api_constant_1.apiRoutes.AUTH, auth_route_1.default);
app.use(api_constant_1.apiRoutes.PRODUCT, product_route_1.default);
app.use(api_constant_1.apiRoutes.CART, cart_route_1.default);
app.use(api_constant_1.apiRoutes.ORDER, order_route_1.default);
app.use(api_constant_1.apiRoutes.DELIVERY_BOY, deliveryBoy_route_1.default);
app.use(api_constant_1.apiRoutes.ADMIN, admin_route_1.default);
app.use(api_constant_1.apiRoutes.NOTIFICATION, notification_route_1.default);
// ─── Kampung Cetak: Parcel Tracking & File Upload ────────
app.use('/api/parcels', parcelRoutes_1.default);
app.use('/api/files', fileUploadRoutes_1.default);
// ─── WhatsApp Webhook (Meta callback verification) ───────
// Callback URL: https://admin.kampungcetak.com/api/webhooks/whatsapp
app.use('/api/webhooks/whatsapp', WhatsAppWebhookService_1.default);
// ─── Admin Panel (served at admin.kampungcetak.com) ──────
const adminPath = path_1.default.join(__dirname, '../../../admin');
app.use('/admin', express_1.default.static(adminPath));
app.get(['/admin', '/admin/*'], (_req, res) => {
    res.sendFile(path_1.default.join(adminPath, 'index.html'));
});
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// -------------------------  error middleware-------------------------------
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
