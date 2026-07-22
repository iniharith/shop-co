import OrderModel from '../db/models/order.model';
import { IParcel } from '../../domain/entities/Parcel';
import { parcelRepository } from '../repositories/ParcelRepository';
import { areWhatsAppCustomerUpdatesEnabled } from './CustomerUpdateSettingsService';
import { easyParcelService, EasyParcelParcelStatus, mapEasyParcelOrderStatus, mapEasyParcelStatus } from './EasyParcelService';
import { whatsAppService } from './WhatsAppService';
import { RedisService } from '../redis/redis';
import { REDIS_KEYS } from '../../shared/constants/redis.constant';

const redisService = new RedisService();

async function invalidateOrderCaches(orderId: string): Promise<void> {
  const order = await OrderModel.findById(orderId).select('userId').lean();
  await redisService.del(REDIS_KEYS.ORDERS);
  await redisService.del(REDIS_KEYS.ORDERS + orderId);
  if (order?.userId) await redisService.del(REDIS_KEYS.ORDERS + order.userId.toString());
}

function whatsappStatus(status: EasyParcelParcelStatus): 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' {
  if (status === 'cancelled' || status === 'returned' || status === 'failed') return 'failed';
  if (status === 'on_hold' || status === 'drop_off') return 'pending';
  return status;
}

export function providerObservationTime(
  events: Array<{ timestamp: Date }> | undefined,
  fallback: Date
): Date {
  const timestamps = (events || [])
    .map((event) => new Date(event.timestamp).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : fallback;
}

export async function updateOrderFromEasyParcelStatus(
  orderId: string,
  statusCode: number,
  observedAt: Date,
  events?: Array<{ status: string; description: string; location: string; timestamp: Date }>
): Promise<boolean> {
  const orderStatus = mapEasyParcelOrderStatus(statusCode);
  const update: Record<string, any> = {
    easyparcelShipmentStatusCode: statusCode,
    easyparcelStatusUpdatedAt: observedAt,
  };
  if (orderStatus) update.orderStatus = orderStatus;
  if (events) update.easyparcelTrackingEvents = events;
  const result = await OrderModel.updateOne(
    {
      _id: orderId,
      $or: [
        { easyparcelStatusUpdatedAt: { $exists: false } },
        { easyparcelStatusUpdatedAt: { $lt: observedAt } },
      ],
    },
    { $set: update }
  );
  await invalidateOrderCaches(orderId);
  return result.modifiedCount > 0;
}

export async function convergeOrderFromParcel(parcel: IParcel): Promise<boolean> {
  if (parcel.shipmentStatusCode === undefined || !parcel.providerStatusUpdatedAt) return false;
  return updateOrderFromEasyParcelStatus(
    parcel.orderId,
    parcel.shipmentStatusCode,
    parcel.providerStatusUpdatedAt,
    parcel.events
  );
}

export async function reconcilePendingAwbs(parcels: IParcel[]): Promise<number> {
  const pending = parcels.filter((parcel) => parcel.easyparcelShipmentId && (!parcel.trackingNumber || parcel.bookingStatus === 'awb_pending'));
  if (!pending.length) return 0;
  const requestedAt = new Date();
  const listed = await easyParcelService.findShipmentsByNumbers(pending.map((parcel) => parcel.easyparcelShipmentId as string));
  const byShipment = new Map(listed.map((shipment) => [shipment.shipmentNumber, shipment]));
  let reconciled = 0;
  for (const parcel of pending) {
    const shipment = byShipment.get(parcel.easyparcelShipmentId as string);
    if (!shipment) continue;
    const bookingStatus = shipment.awbNumber ? 'booked' : 'awb_pending';
    const observedAt = requestedAt;
    await parcelRepository.update(parcel._id.toString(), {
      trackingNumber: shipment.awbNumber || undefined,
      bookingStatus,
      awbUrl: shipment.awbUrl,
      awbUrlsByFormat: shipment.awbUrlsByFormat,
      trackingUrl: shipment.trackingUrl,
      courier: shipment.courier || parcel.courier,
      service: shipment.service,
    });
    await OrderModel.findByIdAndUpdate(parcel.orderId, {
      $set: {
        easyparcelAwb: shipment.awbNumber || '',
        trackingNumber: shipment.awbNumber || '',
        easyparcelBookingStatus: bookingStatus,
        awbUrl: shipment.awbUrl,
        awbUrlsByFormat: shipment.awbUrlsByFormat,
        trackingUrl: shipment.trackingUrl,
        courier: shipment.courier,
      },
    });
    await invalidateOrderCaches(parcel.orderId);
    if (shipment.statusCode !== undefined) {
      await parcelRepository.updateProviderStatus(parcel._id.toString(), observedAt, {
        shipmentStatusCode: shipment.statusCode,
        status: mapEasyParcelStatus(shipment.statusCode),
      });
      await updateOrderFromEasyParcelStatus(parcel.orderId, shipment.statusCode, observedAt);
    }
    reconciled++;
  }
  return reconciled;
}

export async function syncParcelTracking(parcels: IParcel[]): Promise<{ updated: number; notified: number; reconciled: number }> {
  const reconciled = await reconcilePendingAwbs(parcels);
  const refreshed = await Promise.all(parcels.map((parcel) => parcelRepository.findById(parcel._id.toString())));
  const trackable = refreshed.filter((parcel): parcel is IParcel => Boolean(
    parcel?.trackingNumber && !['submitted', 'awb_pending'].includes(parcel.bookingStatus || '')
  ));
  const requestedAt = new Date();
  const results = await easyParcelService.trackParcels(trackable.map((parcel) => parcel.trackingNumber as string));
  const byAwb = new Map(results.map((result) => [result.trackingNumber, result]));
  const notificationsEnabled = await areWhatsAppCustomerUpdatesEnabled();
  let updated = 0;
  let notified = 0;
  for (const parcel of trackable) {
    const result = byAwb.get(parcel.trackingNumber as string);
    if (!result) continue;
    const statusChanged = parcel.shipmentStatusCode === undefined
      ? result.status !== parcel.status
      : result.statusCode !== parcel.shipmentStatusCode;
    const observedAt = providerObservationTime(result.events, requestedAt);
    const applied = await parcelRepository.updateProviderStatus(parcel._id.toString(), observedAt, {
      lastStatus: statusChanged ? parcel.status : parcel.lastStatus,
      status: result.status,
      shipmentStatusCode: result.statusCode,
      courier: result.courier === 'unknown' ? parcel.courier : result.courier,
      events: result.events,
    });
    const current = applied || await parcelRepository.findById(parcel._id.toString());
    if (!current) continue;
    await convergeOrderFromParcel(current);
    if (applied) updated++;
    if (applied && statusChanged && notificationsEnabled && parcel.customerPhone) {
      const sent = await whatsAppService.sendStatusUpdate({
        phone: parcel.customerPhone,
        customerName: parcel.customerName,
        trackingNumber: parcel.trackingNumber as string,
        status: whatsappStatus(result.status),
        courier: result.courier === 'unknown' ? parcel.courier : result.courier,
      });
      if (sent) {
        notified++;
        await parcelRepository.update(parcel._id.toString(), { whatsappNotified: true });
      }
    }
  }
  return { updated, notified, reconciled };
}
