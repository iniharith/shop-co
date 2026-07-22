/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import OrderModel from '../../infrastructure/db/models/order.model';
import { parcelRepository } from '../../infrastructure/repositories/ParcelRepository';
import { easyParcelService } from '../../infrastructure/services/EasyParcelService';
import { convergeOrderFromParcel, providerObservationTime, reconcilePendingAwbs, syncParcelTracking } from '../../infrastructure/services/EasyParcelTrackingSyncService';
import { whatsAppService } from '../../infrastructure/services/WhatsAppService';
import {
  areWhatsAppCustomerUpdatesEnabled,
  setWhatsAppCustomerUpdatesEnabled,
} from '../../infrastructure/services/CustomerUpdateSettingsService';
import authMiddilware, { authorizeRoles } from '../middlewares/auth.middileware';

const router = Router();
router.use(authMiddilware, authorizeRoles('admin', 'sysadmin', 'boss', 'production', 'packaging'));

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
  asyncHandler(async (_req: Request, res: Response) => {
    const enabled = await areWhatsAppCustomerUpdatesEnabled();
    res.json({ success: true, data: { enabled } });
  })
);

router.put(
  '/customer-update-settings',
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
       if (update.status === 'picked_up') orderStatusStr = 'SHIPPED';
       if (['in_transit', 'out_for_delivery'].includes(update.status)) orderStatusStr = 'IN_TRANSIT';
       if (update.status === 'delivered') orderStatusStr = 'DELIVERED';
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

    await reconcilePendingAwbs([parcel]);
    const refreshedParcel = await parcelRepository.findById(req.params.id);
    if (!refreshedParcel?.trackingNumber) {
      res.status(409).json({ success: false, message: 'AWB is still pending from EasyParcel' });
      return;
    }
    const requestedAt = new Date();
    const result = (await easyParcelService.trackParcels([refreshedParcel.trackingNumber]))[0];
    if (!result) {
      res
        .status(502)
        .json({ success: false, message: 'Could not fetch tracking from EasyParcel. Check your API key.' });
      return;
    }

    const statusChanged = refreshedParcel.shipmentStatusCode === undefined
      ? result.status !== refreshedParcel.status
      : result.statusCode !== refreshedParcel.shipmentStatusCode;
    const courier = result.courier === 'unknown' ? refreshedParcel.courier : result.courier;

    const observedAt = providerObservationTime(result.events, requestedAt);
    const updated = await parcelRepository.updateProviderStatus(req.params.id, observedAt, {
      lastStatus: refreshedParcel.status,
      status: result.status as any,
      shipmentStatusCode: result.statusCode,
      courier,
      events: result.events as any,
    });

    const current = updated || await parcelRepository.findById(req.params.id);
    if (current) await convergeOrderFromParcel(current);
    const appliedStatusChanged = statusChanged && Boolean(updated);

    // Auto-notify customer if status changed
    if (appliedStatusChanged && parcel.customerPhone && await areWhatsAppCustomerUpdatesEnabled()) {
      await whatsAppService.sendStatusUpdate({
        phone: parcel.customerPhone,
        customerName: parcel.customerName,
        trackingNumber: refreshedParcel.trackingNumber,
        status: result.status as any,
        courier,
      });
      await parcelRepository.update(req.params.id, { whatsappNotified: true });
    }

    res.json({
      success: true,
      data: current,
      statusChanged: appliedStatusChanged,
      previousStatus: refreshedParcel.status,
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

    await reconcilePendingAwbs([parcel]);
    const refreshedParcel = await parcelRepository.findById(req.params.id);
    if (!refreshedParcel?.awbUrl) {
      res.status(409).json({ success: false, message: 'AWB is still pending from EasyParcel' });
      return;
    }
    res.json({ success: true, awbUrl: refreshedParcel.awbUrl, awbUrlsByFormat: refreshedParcel.awbUrlsByFormat });
  })
);

// ─── POST /api/parcels/sync-all ───────────────────────────────────────────────
// Manually trigger sync of all active parcels
router.post(
  '/sync-all',
  asyncHandler(async (_req: Request, res: Response) => {
    const activeParcels = await parcelRepository.findActiveDeliveries();
    const { updated, notified, reconciled } = await syncParcelTracking(activeParcels);

    res.json({
      success: true,
      message: `Synced ${updated} parcel(s), sent ${notified} WhatsApp notification(s)`,
      updated,
      notified,
      reconciled,
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
      trackingNumber: parcel.trackingNumber || 'Pending',
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
