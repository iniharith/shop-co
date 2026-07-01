/**
 * Coded by Harith
 * Kampungcetak ®
 */
import cron from 'node-cron';
import { parcelRepository } from '../repositories/ParcelRepository';
import { easyParcelService } from '../services/EasyParcelService';
import { whatsAppService } from '../services/WhatsAppService';

/**
 * Cron job that auto-syncs all active parcel statuses every 15 minutes.
 * Sends WhatsApp notification via Meta Business Cloud API on any status change.
 */
export function startTrackingCronJob(): void {
  console.log('[Cron] 🕐 Parcel tracking cron job registered (runs every 15 minutes)');

  // Run immediately on startup
  syncAllParcels();

  // Then every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    syncAllParcels();
  });
}

async function syncAllParcels(): Promise<void> {
  const startTime = Date.now();
  console.log(`[Cron] 🔄 Parcel sync started at ${new Date().toISOString()}`);

  try {
    const activeParcels = await parcelRepository.findActiveDeliveries();

    if (activeParcels.length === 0) {
      console.log('[Cron] ✅ No active parcels to sync');
      return;
    }

    console.log(`[Cron] Found ${activeParcels.length} active parcel(s) to sync`);

    let updatedCount = 0;
    let notifiedCount = 0;
    let errorCount = 0;

    for (const parcel of activeParcels) {
      try {
        const result = await easyParcelService.trackParcel(parcel.trackingNumber);

        if (!result) {
          console.warn(`[Cron] ⚠️  No result from EasyParcel for ${parcel.trackingNumber}`);
          continue;
        }

        const previousStatus = parcel.status;
        const statusChanged = result.status !== previousStatus;

        // Always update events/courier, update status if changed
        await parcelRepository.update(parcel._id as unknown as string, {
          lastStatus: previousStatus,
          status: result.status as any,
          courier: result.courier,
          events: result.events as any,
        });
        updatedCount++;

        if (statusChanged && parcel.customerPhone) {
          console.log(
            `[Cron] 📦 Status changed for ${parcel.trackingNumber}: ` +
              `${previousStatus} → ${result.status}`
          );

          const sent = await whatsAppService.sendStatusUpdate({
            phone: parcel.customerPhone,
            customerName: parcel.customerName,
            trackingNumber: parcel.trackingNumber,
            status: result.status as any,
            courier: result.courier,
          });

          if (sent) {
            await parcelRepository.update(parcel._id as unknown as string, {
              whatsappNotified: true,
            });
            notifiedCount++;
            console.log(`[Cron] 📱 WhatsApp sent to ${parcel.customerPhone}`);
          } else {
            console.warn(
              `[Cron] ⚠️  WhatsApp failed for ${parcel.customerPhone}`
            );
          }
        }
      } catch (innerErr: any) {
        errorCount++;
        console.error(
          `[Cron] ❌ Error processing parcel ${parcel.trackingNumber}:`,
          innerErr?.message
        );
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Cron] ✅ Sync complete in ${elapsed}ms — ` +
        `Updated: ${updatedCount}, WhatsApp sent: ${notifiedCount}, Errors: ${errorCount}`
    );
  } catch (err: any) {
    console.error('[Cron] ❌ Fatal error in parcel sync:', err?.message);
  }
}
