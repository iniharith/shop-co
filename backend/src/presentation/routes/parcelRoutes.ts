/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import OrderModel from '../../infrastructure/db/models/order.model';
import { parcelRepository } from '../../infrastructure/repositories/ParcelRepository';
import { easyParcelService } from '../../infrastructure/services/EasyParcelService';
import { whatsAppService } from '../../infrastructure/services/WhatsAppService';
import {
  areWhatsAppCustomerUpdatesEnabled,
  setWhatsAppCustomerUpdatesEnabled,
} from '../../infrastructure/services/CustomerUpdateSettingsService';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();

// ─── GET /api/parcels ─────────────────────────────────────────────────────────
// List all parcels with optional filters (admin)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, search } = req.query as { status?: string; search?: string };
    const parcels = await parcelRepository.findAll({ status, search });
    const stats = await parcelRepository.getStats();
    res.json({ success: true, data: parcels, stats });
  })
);

// ─── GET /api/parcels/stats ───────────────────────────────────────────────────
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await parcelRepository.getStats();
    const recent = await parcelRepository.getRecentActivity(5);
    res.json({ success: true, data: stats, recent });
  })
);

router.get(
  '/customer-update-settings',
  authMiddilware,
  authorizeRoles('admin', 'sysadmin', 'boss', 'production', 'packaging'),
  asyncHandler(async (_req: Request, res: Response) => {
    const enabled = await areWhatsAppCustomerUpdatesEnabled();
    res.json({ success: true, data: { enabled } });
  })
);

router.put(
  '/customer-update-settings',
  authMiddilware,
  authorizeRoles('admin', 'sysadmin', 'boss'),
  asyncHandler(async (req: Request, res: Response) => {
    if (typeof req.body.enabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'enabled must be a boolean' });
      return;
    }

    const enabled = await setWhatsAppCustomerUpdatesEnabled(req.body.enabled);
    res.json({
      success: true,
      data: { enabled },
      message: `WhatsApp customer auto-updates ${enabled ? 'enabled' : 'disabled'}`,
    });
  })
);

// ─── POST /api/parcels ────────────────────────────────────────────────────────
// Create a new parcel record (admin)
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      orderId,
      trackingNumber,
      customerPhone,
      customerName,
      customerEmail,
      weight,
      senderName,
      senderPhone,
      senderAddress,
      recipientAddress,
      courier,
    } = req.body;

    if (!trackingNumber || !customerPhone || !customerName || !orderId) {
      res
        .status(400)
        .json({
          success: false,
          message: 'orderId, trackingNumber, customerPhone, customerName are required',
        });
      return;
    }

    // Check for duplicate tracking number
    const existing = await parcelRepository.findByTrackingNumber(trackingNumber);
    if (existing) {
      res.status(409).json({ success: false, message: 'Tracking number already exists' });
      return;
    }

    const parcel = await parcelRepository.create({
      orderId,
      trackingNumber,
      customerPhone,
      customerName,
      customerEmail,
      weight: weight || 1,
      senderName: senderName || 'Kampung Cetak',
      senderPhone: senderPhone || '',
      senderAddress: senderAddress || '',
      recipientAddress: recipientAddress || '',
      courier: courier || 'unknown',
      status: 'pending',
      lastStatus: '',
    });

    res.status(201).json({ success: true, data: parcel });
  })
);

// ─── GET /api/parcels/:id ─────────────────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const parcel = await parcelRepository.findById(req.params.id);
    if (!parcel) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }
    res.json({ success: true, data: parcel });
  })
);

// ─── PUT /api/parcels/:id ─────────────────────────────────────────────────────
// Update parcel fields (admin edit)
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const allowed = [
      'orderId',
      'trackingNumber',
      'status',
      'customerPhone',
      'customerName',
      'customerEmail',
      'weight',
      'senderAddress',
      'recipientAddress',
      'courier',
      'easyparcelShipmentId',
    ];
    const update: any = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const updated = await parcelRepository.update(req.params.id, update);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }

    // Sync order status if parcel status is updated manually
    if (update.status && updated.orderId) {
      let orderStatusStr = '';
      if (['picked_up', 'in_transit', 'out_for_delivery'].includes(update.status)) orderStatusStr = 'IN_TRANSIT';
      if (update.status === 'delivered') orderStatusStr = 'DELIVERED';
      if (update.status === 'failed') orderStatusStr = 'CANCELLED';
      if (orderStatusStr) {
         await OrderModel.findByIdAndUpdate(updated.orderId, { orderStatus: orderStatusStr });
      }
    }

    res.json({ success: true, data: updated });
  })
);

// ─── PUT /api/parcels/:id/track ───────────────────────────────────────────────
// Manually refresh tracking status from EasyParcel
router.put(
  '/:id/track',
  asyncHandler(async (req: Request, res: Response) => {
    const parcel = await parcelRepository.findById(req.params.id);
    if (!parcel) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }

    const result = await easyParcelService.trackParcel(parcel.trackingNumber);
    if (!result) {
      res
        .status(502)
        .json({ success: false, message: 'Could not fetch tracking from EasyParcel. Check your API key.' });
      return;
    }

    const statusChanged = result.status !== parcel.status;

    const updated = await parcelRepository.update(req.params.id, {
      lastStatus: parcel.status,
      status: result.status as any,
      courier: result.courier,
      events: result.events as any,
    });

    if (statusChanged && updated?.orderId) {
      let orderStatusStr = '';
      if (['picked_up', 'in_transit', 'out_for_delivery'].includes(result.status)) orderStatusStr = 'IN_TRANSIT';
      if (result.status === 'delivered') orderStatusStr = 'DELIVERED';
      if (result.status === 'failed') orderStatusStr = 'CANCELLED';
      if (orderStatusStr) {
         await OrderModel.findByIdAndUpdate(updated.orderId, { orderStatus: orderStatusStr });
      }
    }

    // Auto-notify customer if status changed
    if (statusChanged && parcel.customerPhone && await areWhatsAppCustomerUpdatesEnabled()) {
      await whatsAppService.sendStatusUpdate({
        phone: parcel.customerPhone,
        customerName: parcel.customerName,
        trackingNumber: parcel.trackingNumber,
        status: result.status as any,
        courier: result.courier,
      });
      await parcelRepository.update(req.params.id, { whatsappNotified: true });
    }

    res.json({
      success: true,
      data: updated,
      statusChanged,
      previousStatus: parcel.status,
      newStatus: result.status,
    });
  })
);

// ─── GET /api/parcels/:id/awb ─────────────────────────────────────────────────
// Get AWB PDF download URL
router.get(
  '/:id/awb',
  asyncHandler(async (req: Request, res: Response) => {
    const parcel = await parcelRepository.findById(req.params.id);
    if (!parcel) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }

    if (!parcel.easyparcelShipmentId) {
      res.status(400).json({
        success: false,
        message: 'No EasyParcel shipment ID on record. Create a shipment first.',
      });
      return;
    }

    // Use cached URL if available
    if (parcel.awbUrl) {
      res.json({ success: true, awbUrl: parcel.awbUrl });
      return;
    }

    const awbUrl = await easyParcelService.getAWB(parcel.easyparcelShipmentId);
    if (!awbUrl) {
      res.status(502).json({ success: false, message: 'Could not fetch AWB from EasyParcel' });
      return;
    }

    await parcelRepository.update(req.params.id, { awbUrl });
    res.json({ success: true, awbUrl });
  })
);

// ─── POST /api/parcels/sync-all ───────────────────────────────────────────────
// Manually trigger sync of all active parcels
router.post(
  '/sync-all',
  asyncHandler(async (_req: Request, res: Response) => {
    const activeParcels = await parcelRepository.findActiveDeliveries();
    let updated = 0;
    let notified = 0;

    for (const parcel of activeParcels) {
      const result = await easyParcelService.trackParcel(parcel.trackingNumber);
      if (!result) continue;

      const statusChanged = result.status !== parcel.status;
      const updatedParcel = await parcelRepository.update(parcel._id as unknown as string, {
        status: result.status as any,
        courier: result.courier,
        events: result.events as any,
      });
      updated++;

      if (statusChanged && updatedParcel?.orderId) {
        let orderStatusStr = '';
        if (['picked_up', 'in_transit', 'out_for_delivery'].includes(result.status)) orderStatusStr = 'IN_TRANSIT';
        if (result.status === 'delivered') orderStatusStr = 'DELIVERED';
        if (result.status === 'failed') orderStatusStr = 'CANCELLED';
        if (orderStatusStr) {
           await OrderModel.findByIdAndUpdate(updatedParcel.orderId, { orderStatus: orderStatusStr });
        }
      }

      if (statusChanged && parcel.customerPhone && await areWhatsAppCustomerUpdatesEnabled()) {
        const sent = await whatsAppService.sendStatusUpdate({
          phone: parcel.customerPhone,
          customerName: parcel.customerName,
          trackingNumber: parcel.trackingNumber,
          status: result.status as any,
          courier: result.courier,
        });
        if (sent) {
          await parcelRepository.update(parcel._id as unknown as string, { whatsappNotified: true });
          notified++;
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${updated} parcel(s), sent ${notified} WhatsApp notification(s)`,
      updated,
      notified,
    });
  })
);

// ─── POST /api/parcels/:id/whatsapp ───────────────────────────────────────────
// Manually send a WhatsApp status update to a customer
router.post(
  '/:id/whatsapp',
  asyncHandler(async (req: Request, res: Response) => {
    if (!await areWhatsAppCustomerUpdatesEnabled()) {
      res.status(503).json({ success: false, message: 'WhatsApp customer updates are temporarily disabled' });
      return;
    }

    const parcel = await parcelRepository.findById(req.params.id);
    if (!parcel) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }

    const sent = await whatsAppService.sendStatusUpdate({
      phone: parcel.customerPhone,
      customerName: parcel.customerName,
      trackingNumber: parcel.trackingNumber,
      status: parcel.status as any,
      courier: parcel.courier,
    });

    if (sent) {
      await parcelRepository.update(parcel._id as unknown as string, { whatsappNotified: true });
    }

    res.json({ success: sent, message: sent ? 'WhatsApp message sent' : 'Failed to send WhatsApp' });
  })
);

// ─── DELETE /api/parcels/:id ──────────────────────────────────────────────────
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const parcel = await parcelRepository.findById(req.params.id);
    if (!parcel) {
      res.status(404).json({ success: false, message: 'Parcel not found' });
      return;
    }
    await parcelRepository.delete(req.params.id);
    res.json({ success: true, message: 'Parcel deleted' });
  })
);

export default router;
