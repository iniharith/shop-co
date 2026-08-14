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
const exceljs_1 = __importDefault(require("exceljs"));
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
    const page = yield MonthlyReportRepository_1.default.getTaskPage(window, cursor, limit);
    const rows = yield MonthlyReportRepository_1.default.assemble(page.tasks);
    const seenOrderIds = new Set();
    const totals = rows.reduce((acc, row) => {
        seenOrderIds.add(String(row.orderId));
        acc.orders = seenOrderIds.size;
        acc.files += row.fileCount;
        acc.bytes += row.fileTotalBytes;
        return acc;
    }, { orders: 0, files: 0, bytes: 0 });
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
            paginationUnit: 'tasks',
        },
    });
})));
// ─── GET /api/admin/reports/monthly-orders/export ──────────────────
router.get('/monthly-orders/export', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const columnWidths = [24, 22, 20, 18, 30, 48, 12, 10, 12, 16, 14, 14, 24];
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = 'Kampungcetak Admin';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Monthly Orders', {
        views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: header.length },
    };
    const headerRow = sheet.addRow(header);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF374151' } } };
    });
    let cursor;
    for (;;) {
        const page = yield MonthlyReportRepository_1.default.getTaskPage(window, cursor, 500);
        const rows = yield MonthlyReportRepository_1.default.assemble(page.tasks);
        for (const row of rows) {
            sheet.addRow([
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
                Number.isFinite(row.fileSizeMB) ? Number(row.fileSizeMB.toFixed(2)) : '',
                Number.isFinite(row.fileSizeGB) ? Number(row.fileSizeGB.toFixed(4)) : '',
                row.assignedTo,
            ]);
        }
        if (!page.hasNextPage)
            break;
        cursor = page.nextCursor || undefined;
    }
    sheet.columns.forEach((column, index) => {
        var _a;
        column.width = (_a = columnWidths[index]) !== null && _a !== void 0 ? _a : 16;
    });
    const buffer = yield workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-orders-${month}.xlsx"`);
    res.send(Buffer.from(buffer));
})));
exports.default = router;
