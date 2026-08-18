import { Router, Response } from 'express';
import asyncHandler from 'express-async-handler';
import authMiddilware from '../middlewares/auth.middileware';
import orderSchema from '../../infrastructure/db/models/order.model';
import { AuthRequest } from '../../domain/types/api';

const router = Router();

function generateInvoiceHtml(order: any): string {
  const orderIdShort = order._id.toString().slice(-6).toUpperCase();
  const items = order.products.map((p: any) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${p.productNameSnapshot || p.product?.name || 'Product'}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.size || '-'}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">RM ${p.price.toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">RM ${(p.price * p.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${orderIdShort}</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px;color:#1f2937;">
  <div style="max-width:800px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
      <div>
        <h1 style="margin:0;font-size:28px;color:#059669;">Kampung Cetak</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Custom Printing & Signage</p>
      </div>
      <div style="text-align:right;">
        <h2 style="margin:0;font-size:22px;color:#374151;">INVOICE</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">INV-${orderIdShort}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${new Date(order.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:30px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;">Bill To</p>
      <p style="margin:0;font-size:15px;font-weight:600;">${order.customerName}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${order.address?.address || ''} ${order.address?.street || ''}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${order.address?.city || ''}, ${order.address?.country || ''}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;color:#6b7280;">Item</th>
          <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;color:#6b7280;">Size</th>
          <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;color:#6b7280;">Qty</th>
          <th style="padding:12px;text-align:right;font-size:12px;font-weight:600;text-transform:uppercase;color:#6b7280;">Price</th>
          <th style="padding:12px;text-align:right;font-size:12px;font-weight:600;text-transform:uppercase;color:#6b7280;">Total</th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div style="width:280px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;">
          <span style="color:#6b7280;">Subtotal</span>
          <span>RM ${order.totalAmount.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;">
          <span style="color:#6b7280;">Shipping</span>
          <span>Free</span>
        </div>
        <div style="border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;padding:12px 0 0;font-size:16px;font-weight:700;">
          <span>Total</span>
          <span style="color:#059669;">RM ${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:12px;color:#9ca3af;">
      <div>
        <p style="margin:0;">Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
        ${order.trackingNumber ? `<p style="margin:4px 0 0;">Tracking: ${order.trackingNumber}</p>` : ''}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;">kampungcetak.com</p>
        <p style="margin:2px 0 0;">Thank you for your order!</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

router.get('/:orderId/invoice', authMiddilware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const order = await orderSchema.findOne({ _id: orderId, userId }).populate('products.product').lean();
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  const orderIdShort = order._id.toString().slice(-6).toUpperCase();
  const html = generateInvoiceHtml(order);

  let browser;
  try {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="INV-${orderIdShort}.pdf"`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
}));

export default router;
