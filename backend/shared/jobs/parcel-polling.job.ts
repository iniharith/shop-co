/**
 * Coded by Harith
 * Kampungcetak ®
 */
import cron from 'node-cron';
import ParcelModel from '../../infrastructure/db/models/parcel.model';
import { EasyParcelService } from '../services/easyparcel.service';
import { WhatsAppService } from '../services/whatsapp.service';

const easyParcel = new EasyParcelService();
const whatsApp = new WhatsAppService();

// Statuses considered "final" — no need to poll further
const FINAL_STATUSES = ['DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'];

/**
 * Background cron job that polls EasyParcel every 30 minutes for all
 * active parcels and sends WhatsApp notifications on status changes.
 */
export function startParcelPollingJob() {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[ParcelJob] 🔄 Running parcel status polling...');

    try {
      // Only fetch parcels not in a final state
      const activeParcels = await ParcelModel.find({
        status: { $nin: FINAL_STATUSES },
      });

      if (activeParcels.length === 0) {
        console.log('[ParcelJob] ✅ No active parcels to poll.');
        return;
      }

      console.log(`[ParcelJob] 📦 Polling ${activeParcels.length} parcel(s)...`);

      for (const parcel of activeParcels) {
        try {
          const tracking = await easyParcel.trackParcel(parcel.awbNumber);

          if (!tracking) {
            console.warn(`[ParcelJob] ⚠️  No data for AWB: ${parcel.awbNumber}`);
            continue;
          }

          const previousStatus = parcel.status;
          const statusChanged = previousStatus !== tracking.status;

          if (statusChanged) {
            console.log(
              `[ParcelJob] 🔁 ${parcel.awbNumber}: ${previousStatus} → ${tracking.status}`
            );

            parcel.status = tracking.status;
            parcel.statusHistory.push({
              status: tracking.status,
              description: tracking.description,
              timestamp: new Date(),
            });

            // Send WhatsApp notification
            if (parcel.customerPhone) {
              const sent = await whatsApp.sendParcelStatusUpdate(
                parcel.customerPhone,
                parcel.customerName,
                parcel.awbNumber,
                tracking.status,
                tracking.tracking_url
              );

              if (sent) {
                parcel.lastWhatsappSentStatus = tracking.status;
                console.log(`[ParcelJob] 💬 WhatsApp sent to ${parcel.customerPhone}`);
              }
            }

            await parcel.save();
          }
        } catch (innerErr: any) {
          console.error(`[ParcelJob] ❌ Error for AWB ${parcel.awbNumber}:`, innerErr.message);
        }
      }

      console.log('[ParcelJob] ✅ Polling cycle complete.');
    } catch (err: any) {
      console.error('[ParcelJob] ❌ Fatal error in polling job:', err.message);
    }
  });

  console.log('[ParcelJob] 📅 Parcel polling scheduled every 30 minutes.');
}
