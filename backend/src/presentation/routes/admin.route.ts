/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from "express";
import mongoose from "mongoose";
import { AdminController } from "../controllers/admin.controller";
import authMiddilware, { authorizeRoles } from "../middlewares/auth.middileware";
import { uploadAvatar } from "../middlewares/uploadAvatar.middleware";
import User from "../../infrastructure/db/models/user.model";
import asyncHandler from "express-async-handler";

import Order from "../../infrastructure/db/models/order.model";
import { Task } from "../../domain/entities/Task";
import { FileUpload } from "../../domain/entities/FileUpload";
import { Project } from "../../domain/entities/Project";
import { Parcel } from "../../domain/entities/Parcel";

const router = Router();
const adminController = new AdminController();
const SEARCH_MAX_TIME_MS = 5_000;

const prioritizeExact = <T>(rows: T[], isExact: (row: T) => boolean): T[] =>
  rows.sort((left, right) => Number(isExact(right)) - Number(isExact(left)));

// Quick migration endpoint for the user to trigger in their browser
router.get("/migrate-statuses", asyncHandler(async (req, res) => {
  try {
    const o1 = await Order.collection.updateMany({ orderStatus: "ARTWORK_REVIEW" }, { $set: { orderStatus: "ARTWORK_REVIEWED" } });
    const o2 = await Order.collection.updateMany({ orderStatus: "DONE DESIGN" }, { $set: { orderStatus: "DONE_DESIGN" } });
    
    const t1 = await Task.collection.updateMany({ status: "ARTWORK_REVIEW" }, { $set: { status: "ARTWORK_REVIEWED" } });
    const t2 = await Task.collection.updateMany({ status: "DONE DESIGN" }, { $set: { status: "DONE_DESIGN" } });
    const t3 = await Task.collection.updateMany({ status: "TODO" }, { $set: { status: "PLACED" } });
    const t4 = await Task.collection.updateMany({ status: "ARTWORK_REJECT" }, { $set: { status: "ARTWORK_REJECTED" } });
    const t5 = await Task.collection.updateMany({ status: "DONE_PRINTING" }, { $set: { status: "PACKAGING" } });
    
    res.json({
      success: true,
      message: "Database statuses migrated successfully",
      ordersUpdated: o1.modifiedCount + o2.modifiedCount,
      tasksUpdated: t1.modifiedCount + t2.modifiedCount + t3.modifiedCount + t4.modifiedCount + t5.modifiedCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}));

router.get(
  "/search",
  authMiddilware,
  authorizeRoles("admin", "sysadmin", "boss", "designer", "production", "packaging", "awapparel"),
  asyncHandler(async (req, res) => {
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
      ? new mongoose.Types.ObjectId(query)
      : null;
    const fetchLimit = limit + 1;
    const role = (req as any).role as string;
    const isAwapparel = role === "awapparel";
    const canSearchTasks = !isAwapparel;
    const canSearchOrders = !isAwapparel;
    const canSearchCustomers = ["admin", "sysadmin", "boss"].includes(role);
    const canSearchProjects = ["admin", "sysadmin", "boss", "designer"].includes(role);
    const canSearchTracking = ["admin", "sysadmin", "boss", "production", "packaging"].includes(role);

    const taskMatches: any[] = [
      { title: searchRegex },
      { description: searchRegex },
      { orderId: searchRegex },
      { customerUsername: searchRegex },
      { category: searchRegex },
      { status: searchRegex },
    ];
    const orderMatches: any[] = [
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
    const customerMatches: any[] = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
    ];
    const fileMatches: any[] = [
      { originalName: searchRegex },
      { filename: searchRegex },
      { mimetype: searchRegex },
      { category: searchRegex },
      { taskId: searchRegex },
      { orderId: searchRegex },
      { userId: searchRegex },
    ];
    const projectMatches: any[] = [
      { title: searchRegex },
      { description: searchRegex },
    ];
    const trackingMatches: any[] = [
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

    const [taskRows, orderRows, customerRows, fileRows, projectRows, trackingRows] = await Promise.all([
      canSearchTasks
        ? Task.find({ isDeleted: { $ne: true }, $or: taskMatches })
            .select("_id title status orderId customerUsername updatedAt")
            .sort({ updatedAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean()
        : Promise.resolve([]),
      canSearchOrders
        ? Order.find({ isDeleted: { $ne: true }, $or: orderMatches })
            .select("_id orderStatus customerName shippingCustomerEmail trackingNumber createdAt")
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean()
        : Promise.resolve([]),
      canSearchCustomers
        ? User.find({ role: "client", $or: customerMatches })
            .select("_id name email phoneNumber")
            .sort({ updatedAt: -1 })
            .limit(fetchLimit)
            .maxTimeMS(SEARCH_MAX_TIME_MS)
            .lean()
        : Promise.resolve([]),
      FileUpload.find(isAwapparel ? { category: "APPAREL", $or: fileMatches } : { $or: fileMatches })
        .select("_id originalName filename mimetype category taskId orderId userId uploadedAt")
        .sort({ uploadedAt: -1 })
        .limit(fetchLimit)
        .maxTimeMS(SEARCH_MAX_TIME_MS)
        .lean(),
      canSearchProjects
        ? Project.aggregate([
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
        ? Parcel.find({
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
    const isExactValue = (value: unknown) =>
      value !== null && value !== undefined && String(value).toLowerCase() === normalizedQuery;

    const rankedTasks = prioritizeExact(taskRows as any[], row =>
      isExactValue(row._id) || isExactValue(row.orderId)
    );
    const rankedOrders = prioritizeExact(orderRows as any[], row =>
      isExactValue(row._id) || isExactValue(row.trackingNumber) || isExactValue(row.shippingCustomerEmail)
    );
    const rankedCustomers = prioritizeExact(customerRows as any[], row =>
      isExactValue(row._id) || isExactValue(row.email)
    );
    const rankedFiles = prioritizeExact(fileRows as any[], row =>
      isExactValue(row._id) || isExactValue(row.taskId) || isExactValue(row.orderId) || isExactValue(row.userId)
    );
    const rankedProjects = prioritizeExact(projectRows as any[], row => isExactValue(row._id));
    const rankedTracking = prioritizeExact(trackingRows as any[], row =>
      isExactValue(row._id) || isExactValue(row.trackingNumber) || isExactValue(row.customerEmail)
    );

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
  })
);

router.get("/users", authMiddilware, adminController.getUsers.bind(adminController));
router.post("/users", authMiddilware, adminController.createUser.bind(adminController));
router.put("/users/:id", authMiddilware, adminController.updateUser.bind(adminController));
router.delete("/users/:id", authMiddilware, adminController.deleteUser.bind(adminController));

router.get("/orders", authMiddilware, adminController.getOrders.bind(adminController));
router.post("/orders/manual", authMiddilware, adminController.createManualOrder.bind(adminController));
router.post("/orders/bulk-delete", authMiddilware, adminController.bulkDeleteOrders.bind(adminController));
router.delete("/orders/:id", authMiddilware, adminController.deleteOrder.bind(adminController));

router.post("/seed-test-data", authMiddilware, adminController.seedTestData.bind(adminController));
router.delete("/clear-test-data", authMiddilware, adminController.clearTestData.bind(adminController));

router.post("/users/:id/avatar", authMiddilware, uploadAvatar.single('avatar'), asyncHandler(async (req: any, res: any) => {
    const userId = req.params.id;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Tiada fail dipilih' });
        return;
    }
    const avatarUrl = (req.file as any).location;
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
}));

export default router;
