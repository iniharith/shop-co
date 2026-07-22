/**
 * Coded by Harith
 * Kampungcetak ®
 */
import cron from 'node-cron';
import { parcelRepository } from '../repositories/ParcelRepository';
import { syncParcelTracking } from '../services/EasyParcelTrackingSyncService';

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

    const result = await syncParcelTracking(activeParcels);

    const elapsed = Date.now() - startTime;
    console.log(
      `[Cron] ✅ Sync complete in ${elapsed}ms — ` +
        `Updated: ${result.updated}, AWBs reconciled: ${result.reconciled}, WhatsApp sent: ${result.notified}`
    );
  } catch (err: any) {
    console.error('[Cron] ❌ Fatal error in parcel sync:', err?.message);
  }
}
