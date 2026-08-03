"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const uploadAvatar_middleware_1 = require("../middlewares/uploadAvatar.middleware");
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const Project_1 = require("../../domain/entities/Project");
const Parcel_1 = require("../../domain/entities/Parcel");
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
const SEARCH_MAX_TIME_MS = 5000;
const prioritizeExact = (rows, isExact) => rows.sort((left, right) => Number(isExact(right)) - Number(isExact(left)));
// Quick migration endpoint for the user to trigger in their browser
router.get("/migrate-statuses", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const o1 = yield order_model_1.default.collection.updateMany({ orderStatus: "ARTWORK_REVIEW" }, { $set: { orderStatus: "ARTWORK_REVIEWED" } });
        const o2 = yield order_model_1.default.collection.updateMany({ orderStatus: "DONE DESIGN" }, { $set: { orderStatus: "DONE_DESIGN" } });
        const t1 = yield Task_1.Task.collection.updateMany({ status: "ARTWORK_REVIEW" }, { $set: { status: "ARTWORK_REVIEWED" } });
        const t2 = yield Task_1.Task.collection.updateMany({ status: "DONE DESIGN" }, { $set: { status: "DONE_DESIGN" } });
        const t3 = yield Task_1.Task.collection.updateMany({ status: "TODO" }, { $set: { status: "PLACED" } });
        const t4 = yield Task_1.Task.collection.updateMany({ status: "ARTWORK_REJECT" }, { $set: { status: "ARTWORK_REJECTED" } });
        const t5 = yield Task_1.Task.collection.updateMany({ status: "DONE_PRINTING" }, { $set: { status: "PACKAGING" } });
        res.json({
            success: true,
            message: "Database statuses migrated successfully",
            ordersUpdated: o1.modifiedCount + o2.modifiedCount,
            tasksUpdated: t1.modifiedCount + t2.modifiedCount + t3.modifiedCount + t4.modifiedCount + t5.modifiedCount
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
})));
router.get("/search", auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)("admin", "sysadmin", "boss", "designer", "production", "packaging"), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startedAt = Date.now();
    const query = (typeof req.query.q === "string" ? req.query.q : "").trim().slice(0, 100);
    const parsedLimit = typeof req.query.limit === "string"
        ? Number.parseInt(req.query.limit, 10)
        : Number.NaN;
    const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 20)
        : 5;
    const emptyGroups = {
        tasks: [],
        orders: [],
        customers: [],
        files: [],
        projects: [],
        tracking: [],
    };
    const emptyHasMore = {
        tasks: false,
        orders: false,
        customers: false,
        files: false,
        projects: false,
        tracking: false,
    };
    if (query.length < 2) {
        res.json({
            success: true,
            query,
            groups: emptyGroups,
            hasMore: emptyHasMore,
            tookMs: Date.now() - startedAt,
        });
        return;
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");
    const objectId = /^[a-f\d]{24}$/i.test(query)
        ? new mongoose_1.default.Types.ObjectId(query)
        : null;
    const fetchLimit = limit + 1;
    const role = req.role;
    const canSearchCustomers = ["admin", "sysadmin", "boss"].includes(role);
    const canSearchProjects = ["admin", "sysadmin", "boss", "designer"].includes(role);
    const canSearchTracking = ["admin", "sysadmin", "boss", "production", "packaging"].includes(role);
    const taskMatches = [
        { title: searchRegex },
        { description: searchRegex },
        { orderId: searchRegex },
        { customerUsername: searchRegex },
        { category: searchRegex },
        { status: searchRegex },
    ];
    const orderMatches = [
        { customerName: searchRegex },
        { shippingCustomerEmail: searchRegex },
        { shippingCustomerPhone: searchRegex },
        { trackingNumber: searchRegex },
        { easyparcelOrderNo: searchRegex },
        { easyparcelAwb: searchRegex },
        { easyparcelShipmentId: searchRegex },
        { courier: searchRegex },
        { orderStatus: searchRegex },
    ];
    const customerMatches = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
    ];
    const fileMatches = [
        { originalName: searchRegex },
        { filename: searchRegex },
        { mimetype: searchRegex },
        { category: searchRegex },
        { taskId: searchRegex },
        { orderId: searchRegex },
        { userId: searchRegex },
    ];
    const projectMatches = [
        { title: searchRegex },
        { description: searchRegex },
    ];
    const trackingMatches = [
        { trackingNumber: searchRegex },
        { orderId: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { courier: searchRegex },
        { service: searchRegex },
        { status: searchRegex },
        { lastStatus: searchRegex },
        { easyparcelShipmentId: searchRegex },
        { easyparcelOrderNumber: searchRegex },
    ];
    if (objectId) {
        taskMatches.push({ _id: objectId });
        orderMatches.push({ _id: objectId });
        customerMatches.push({ _id: objectId });
        fileMatches.push({ _id: objectId });
        projectMatches.push({ _id: objectId });
        trackingMatches.push({ _id: objectId });
    }
    const [taskRows, orderRows, customerRows, fileRows, projectRows, trackingRows] = yield Promise.all([
        Task_1.Task.find({ isDeleted: { $ne: true }, $or: taskMatches })
            .select("_id title status orderId customerUsername updatedAt")
            .sort({ updatedAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean(),
        order_model_1.default.find({ isDeleted: { $ne: true }, $or: orderMatches })
            .select("_id orderStatus customerName shippingCustomerEmail trackingNumber createdAt")
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean(),
        canSearchCustomers
            ? user_model_1.default.find({ role: "client", $or: customerMatches })
                .select("_id name email phoneNumber")
                .sort({ updatedAt: -1 })
                .limit(fetchLimit)
                .maxTimeMS(SEARCH_MAX_TIME_MS)
                .lean()
            : Promise.resolve([]),
        FileUpload_1.FileUpload.find({ $or: fileMatches })
            .select("_id originalName filename mimetype category taskId orderId userId uploadedAt")
            .sort({ uploadedAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean(),
        canSearchProjects
            ? Project_1.Project.aggregate([
                { $match: { deletingAt: null, $or: projectMatches } },
                { $sort: { updatedAt: -1 } },
                { $limit: fetchLimit },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        fileCount: { $size: { $ifNull: ["$files", []] } },
                        updatedAt: 1,
                    },
                },
            ]).option({ maxTimeMS: SEARCH_MAX_TIME_MS })
            : Promise.resolve([]),
        canSearchTracking
            ? Parcel_1.Parcel.find({
                trackingNumber: { $exists: true, $nin: [null, ""] },
                $or: trackingMatches,
            })
                .select("_id trackingNumber orderId customerName customerEmail courier status updatedAt")
                .sort({ updatedAt: -1 })
                .limit(fetchLimit)
                .maxTimeMS(SEARCH_MAX_TIME_MS)
                .lean()
            : Promise.resolve([]),
    ]);
    const normalizedQuery = query.toLowerCase();
    const isExactValue = (value) => value !== null && value !== undefined && String(value).toLowerCase() === normalizedQuery;
    const rankedTasks = prioritizeExact(taskRows, row => isExactValue(row._id) || isExactValue(row.orderId));
    const rankedOrders = prioritizeExact(orderRows, row => isExactValue(row._id) || isExactValue(row.trackingNumber) || isExactValue(row.shippingCustomerEmail));
    const rankedCustomers = prioritizeExact(customerRows, row => isExactValue(row._id) || isExactValue(row.email));
    const rankedFiles = prioritizeExact(fileRows, row => isExactValue(row._id) || isExactValue(row.taskId) || isExactValue(row.orderId) || isExactValue(row.userId));
    const rankedProjects = prioritizeExact(projectRows, row => isExactValue(row._id));
    const rankedTracking = prioritizeExact(trackingRows, row => isExactValue(row._id) || isExactValue(row.trackingNumber) || isExactValue(row.customerEmail));
    res.json({
        success: true,
        query,
        groups: {
            tasks: rankedTasks.slice(0, limit).map(row => ({
                id: String(row._id),
                title: row.title,
                status: row.status,
                orderId: row.orderId || undefined,
                customerUsername: row.customerUsername || undefined,
                updatedAt: row.updatedAt || undefined,
            })),
            orders: rankedOrders.slice(0, limit).map(row => ({
                id: String(row._id),
                status: row.orderStatus,
                customerName: row.customerName || undefined,
                customerEmail: row.shippingCustomerEmail || undefined,
                trackingNumber: row.trackingNumber || undefined,
                createdAt: row.createdAt || undefined,
            })),
            customers: rankedCustomers.slice(0, limit).map(row => ({
                id: String(row._id),
                name: row.name,
                email: row.email || undefined,
                phoneNumber: row.phoneNumber || undefined,
            })),
            files: rankedFiles.slice(0, limit).map(row => ({
                id: String(row._id),
                name: row.originalName || row.filename,
                mimetype: row.mimetype || undefined,
                category: row.category || undefined,
                taskId: row.taskId || undefined,
                orderId: row.orderId || undefined,
                userId: row.userId || undefined,
                uploadedAt: row.uploadedAt || undefined,
            })),
            projects: rankedProjects.slice(0, limit).map(row => ({
                id: String(row._id),
                title: row.title,
                description: row.description || undefined,
                fileCount: row.fileCount || 0,
                updatedAt: row.updatedAt || undefined,
            })),
            tracking: rankedTracking.slice(0, limit).map(row => ({
                id: String(row._id),
                trackingNumber: row.trackingNumber,
                orderId: row.orderId || undefined,
                customerName: row.customerName || undefined,
                courier: row.courier || undefined,
                status: row.status || undefined,
                updatedAt: row.updatedAt || undefined,
            })),
        },
        hasMore: {
            tasks: taskRows.length > limit,
            orders: orderRows.length > limit,
            customers: customerRows.length > limit,
            files: fileRows.length > limit,
            projects: projectRows.length > limit,
            tracking: trackingRows.length > limit,
        },
        tookMs: Date.now() - startedAt,
    });
})));
router.get("/users", auth_middileware_1.default, adminController.getUsers.bind(adminController));
router.post("/users", auth_middileware_1.default, adminController.createUser.bind(adminController));
router.put("/users/:id", auth_middileware_1.default, adminController.updateUser.bind(adminController));
router.delete("/users/:id", auth_middileware_1.default, adminController.deleteUser.bind(adminController));
router.get("/orders", auth_middileware_1.default, adminController.getOrders.bind(adminController));
router.post("/orders/manual", auth_middileware_1.default, adminController.createManualOrder.bind(adminController));
router.post("/orders/bulk-delete", auth_middileware_1.default, adminController.bulkDeleteOrders.bind(adminController));
router.delete("/orders/:id", auth_middileware_1.default, adminController.deleteOrder.bind(adminController));
router.post("/seed-test-data", auth_middileware_1.default, adminController.seedTestData.bind(adminController));
router.delete("/clear-test-data", auth_middileware_1.default, adminController.clearTestData.bind(adminController));
router.post("/users/:id/avatar", auth_middileware_1.default, uploadAvatar_middleware_1.uploadAvatar.single('avatar'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = req.file.location;
    yield user_model_1.default.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
})));
exports.default = router;
