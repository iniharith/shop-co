/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Monthly orders database report. Accessible only to elevated staff roles.
 */
import { Router, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';
import { getMonthWindow, escapeCsvCell } from '../../shared/utils/monthlyReport';
import monthlyReportRepository from '../../infrastructure/repositories/MonthlyReportRepository';

const router = Router();

router.use(authMiddilware, authorizeRoles('admin', 'sysadmin', 'boss'));

const parseMonth = (value: unknown): { month: string; timezone: string } => {
  const month = typeof value === 'string' ? value : '';
  const window = getMonthWindow(month);
  return { month: window.month, timezone: window.timezone };
};

// ─── GET /api/admin/reports/monthly-orders ─────────────────────────
router.get('/monthly-orders', asyncHandler(async (req: any, res: Response) => {
  const { month, timezone } = parseMonth(req.query.month);
  const window = getMonthWindow(month, timezone);
  const limit = Number(req.query.limit) || 100;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  const page = await monthlyReportRepository.getTaskPage(window, cursor, limit);
  const rows = await monthlyReportRepository.assemble(page.tasks);

  const seenOrderIds = new Set<string>();
  const totals = rows.reduce(
    (acc, row) => {
      seenOrderIds.add(String(row.orderId));
      acc.orders = seenOrderIds.size;
      acc.files += row.fileCount;
      acc.bytes += row.fileTotalBytes;
      return acc;
    },
    { orders: 0, files: 0, bytes: 0 }
  );

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
}));

// ─── GET /api/admin/reports/monthly-orders/export ──────────────────
router.get('/monthly-orders/export', asyncHandler(async (req: any, res: Response) => {
  const { month, timezone } = parseMonth(req.query.month);
  const window = getMonthWindow(month, timezone);

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
  const lines = [header.map(escapeCsvCell).join(',')];

  let cursor: string | undefined;
  for (;;) {
    const page = await monthlyReportRepository.getTaskPage(window, cursor, 500);
    const rows = await monthlyReportRepository.assemble(page.tasks);
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
        row.fileSizeMB?.toFixed(2),
        row.fileSizeGB?.toFixed(4),
        row.assignedTo,
      ].map(escapeCsvCell).join(','));
    }
    if (!page.hasNextPage) break;
    cursor = page.nextCursor || undefined;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="monthly-orders-${month}.csv"`);
  // UTF-8 BOM so Excel opens the file with correct encoding.
  res.send('\uFEFF' + lines.join('\r\n'));
}));

export default router;
