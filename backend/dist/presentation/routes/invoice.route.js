"use strict";
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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importDefault(require("../middlewares/auth.middileware"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const router = (0, express_1.Router)();
function generateInvoiceHtml(order) {
    var _a, _b, _c, _d;
    const escapeHtml = (value) => String(value !== null && value !== void 0 ? value : '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    const items = order.products.map((p) => {
        var _a, _b, _c, _d, _e;
        const lineTotal = (_a = p.lineTotal) !== null && _a !== void 0 ? _a : p.price;
        const unitPrice = (_b = p.unitPrice) !== null && _b !== void 0 ? _b : (p.quantity > 0 ? lineTotal / p.quantity : lineTotal);
        const configuration = p.configuration;
        const selections = ((_c = configuration === null || configuration === void 0 ? void 0 : configuration.selections) === null || _c === void 0 ? void 0 : _c.flatMap((selection) => { var _a; return ((_a = selection.values) === null || _a === void 0 ? void 0 : _a.map((value) => `${selection.name}: ${value.label}`)) || []; })) || [];
        const design = ((_d = configuration === null || configuration === void 0 ? void 0 : configuration.design) === null || _d === void 0 ? void 0 : _d.label) ? [`Design: ${configuration.design.label}`] : [];
        const details = [...selections, ...design].map(escapeHtml).join('<br>');
        return `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;"><strong>${escapeHtml(p.productNameSnapshot || ((_e = p.product) === null || _e === void 0 ? void 0 : _e.name) || 'Product')}</strong>${details ? `<div style="font-size:11px;color:#6b7280;margin-top:4px;line-height:1.5;">${details}</div>` : ''}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(p.size || '-')}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">RM ${unitPrice.toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">RM ${lineTotal.toFixed(2)}</td>
    </tr>
  `;
    }).join('');
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
      <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${((_a = order.address) === null || _a === void 0 ? void 0 : _a.address) || ''} ${((_b = order.address) === null || _b === void 0 ? void 0 : _b.street) || ''}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${((_c = order.address) === null || _c === void 0 ? void 0 : _c.city) || ''}, ${((_d = order.address) === null || _d === void 0 ? void 0 : _d.country) || ''}</p>
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
           <span>RM ${(order.totalAmount - (order.shippingPrice || 0)).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;">
          <span style="color:#6b7280;">Shipping</span>
           <span>${order.shippingPrice ? `RM ${Number(order.shippingPrice).toFixed(2)}${order.courier ? ` (${escapeHtml(order.courier)})` : ''}` : 'Free'}</span>
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
router.get('/:orderId/invoice', auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const order = yield order_model_1.default.findOne({ _id: orderId, userId }).populate('products.product').lean();
    if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
    }
    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    const html = generateInvoiceHtml(order);
    let browser;
    try {
        const puppeteer = require('puppeteer');
        browser = yield puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = yield browser.newPage();
        yield page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = yield page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
        yield browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="INV-${orderIdShort}.pdf"`);
        res.send(Buffer.from(pdf));
    }
    catch (error) {
        if (browser)
            yield browser.close().catch(() => { });
        res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
    }
})));
exports.default = router;
