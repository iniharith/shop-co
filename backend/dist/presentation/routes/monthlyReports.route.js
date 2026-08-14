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
 *
 * Monthly orders database report. Accessible only to elevated staff roles.
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const monthlyReport_1 = require("../../shared/utils/monthlyReport");
const MonthlyReportRepository_1 = __importDefault(require("../../infrastructure/repositories/MonthlyReportRepository"));
const router = (0, express_1.Router)();
router.use(auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss'));
const parseMonth = (value) => {
    const month = typeof value === 'string' ? value : '';
    const window = (0, monthlyReport_1.getMonthWindow)(month);
    return { month: window.month, timezone: window.timezone };
};
// ─── GET /api/admin/reports/monthly-orders ─────────────────────────
router.get('/monthly-orders', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, timezone } = parseMonth(req.query.month);
    const window = (0, monthlyReport_1.getMonthWindow)(month, timezone);
    const limit = Number(req.query.limit) || 100;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const page = yield MonthlyReportRepository_1.default.getOrderPage(window, cursor, limit);
    const rows = yield MonthlyReportRepository_1.default.assemble(page.orders);
    const totals = rows.reduce((acc, row) => {
        acc.orders = new Set([...acc.orders, row.orderId]).size;
        acc.files += row.fileCount;
        acc.bytes += row.fileTotalBytes;
        return acc;
    }, { orders: new Set(), files: 0, bytes: 0 });
    res.json({
        success: true,
        period: { month, timezone, start: window.start, endExclusive: window.endExclusive },
        summary: {
            orderCount: totals.orders,
            fileCount: totals.files,
            fileSizeMB: totals.bytes / (1024 * 1024),
            fileSizeGB: totals.bytes / (1024 * 1024 * 1024),
        },
        rows,
        pageInfo: {
            limit,
            hasNextPage: page.hasNextPage,
            nextCursor: page.nextCursor,
            paginationUnit: 'orders',
        },
    });
})));
// ─── GET /api/admin/reports/monthly-orders/export ──────────────────
router.get('/monthly-orders/export', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { month, timezone } = parseMonth(req.query.month);
    const window = (0, monthlyReport_1.getMonthWindow)(month, timezone);
    const header = [
        'Customer Name',
        'Order ID',
        'Order Date',
        'Item Category',
        'Item Ordered',
        'Item Description',
        'Size',
        'Quantity',
        'File Count',
        'File Size Bytes',
        'File Size MB',
        'File Size GB',
        'Assigned To',
    ];
    const lines = [header.map(monthlyReport_1.escapeCsvCell).join(',')];
    let cursor;
    for (;;) {
        const page = yield MonthlyReportRepository_1.default.getOrderPage(window, cursor, 500);
        const rows = yield MonthlyReportRepository_1.default.assemble(page.orders);
        for (const row of rows) {
            lines.push([
                row.customerName,
                row.orderId,
                row.orderDate ? new Date(row.orderDate).toISOString() : '',
                row.category,
                row.itemName,
                row.itemDescription,
                row.size,
                row.quantity,
                row.fileCount,
                row.fileTotalBytes,
                (_a = row.fileSizeMB) === null || _a === void 0 ? void 0 : _a.toFixed(2),
                (_b = row.fileSizeGB) === null || _b === void 0 ? void 0 : _b.toFixed(4),
                row.assignedTo,
            ].map(monthlyReport_1.escapeCsvCell).join(','));
        }
        if (!page.hasNextPage)
            break;
        cursor = page.nextCursor || undefined;
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-orders-${month}.csv"`);
    // UTF-8 BOM so Excel opens the file with correct encoding.
    res.send('\uFEFF' + lines.join('\r\n'));
})));
exports.default = router;
