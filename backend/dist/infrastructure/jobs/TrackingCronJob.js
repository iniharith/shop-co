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
exports.startTrackingCronJob = startTrackingCronJob;
const node_cron_1 = __importDefault(require("node-cron"));
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const EasyParcelService_1 = require("../services/EasyParcelService");
const WhatsAppService_1 = require("../services/WhatsAppService");
/**
 * Cron job that auto-syncs all active parcel statuses every 15 minutes.
 * Sends WhatsApp notification via Meta Business Cloud API on any status change.
 */
function startTrackingCronJob() {
    console.log('[Cron] 🕐 Parcel tracking cron job registered (runs every 15 minutes)');
    // Run immediately on startup
    syncAllParcels();
    // Then every 15 minutes
    node_cron_1.default.schedule('*/15 * * * *', () => {
        syncAllParcels();
    });
}
function syncAllParcels() {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        console.log(`[Cron] 🔄 Parcel sync started at ${new Date().toISOString()}`);
        try {
            const activeParcels = yield ParcelRepository_1.parcelRepository.findActiveDeliveries();
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
                    const result = yield EasyParcelService_1.easyParcelService.trackParcel(parcel.trackingNumber);
                    if (!result) {
                        console.warn(`[Cron] ⚠️  No result from EasyParcel for ${parcel.trackingNumber}`);
                        continue;
                    }
                    const previousStatus = parcel.status;
                    const statusChanged = result.status !== previousStatus;
                    // Always update events/courier, update status if changed
                    yield ParcelRepository_1.parcelRepository.update(parcel._id, {
                        lastStatus: previousStatus,
                        status: result.status,
                        courier: result.courier,
                        events: result.events,
                    });
                    updatedCount++;
                    if (statusChanged && parcel.customerPhone) {
                        console.log(`[Cron] 📦 Status changed for ${parcel.trackingNumber}: ` +
                            `${previousStatus} → ${result.status}`);
                        const sent = yield WhatsAppService_1.whatsAppService.sendStatusUpdate({
                            phone: parcel.customerPhone,
                            customerName: parcel.customerName,
                            trackingNumber: parcel.trackingNumber,
                            status: result.status,
                            courier: result.courier,
                        });
                        if (sent) {
                            yield ParcelRepository_1.parcelRepository.update(parcel._id, {
                                whatsappNotified: true,
                            });
                            notifiedCount++;
                            console.log(`[Cron] 📱 WhatsApp sent to ${parcel.customerPhone}`);
                        }
                        else {
                            console.warn(`[Cron] ⚠️  WhatsApp failed for ${parcel.customerPhone}`);
                        }
                    }
                }
                catch (innerErr) {
                    errorCount++;
                    console.error(`[Cron] ❌ Error processing parcel ${parcel.trackingNumber}:`, innerErr === null || innerErr === void 0 ? void 0 : innerErr.message);
                }
            }
            const elapsed = Date.now() - startTime;
            console.log(`[Cron] ✅ Sync complete in ${elapsed}ms — ` +
                `Updated: ${updatedCount}, WhatsApp sent: ${notifiedCount}, Errors: ${errorCount}`);
        }
        catch (err) {
            console.error('[Cron] ❌ Fatal error in parcel sync:', err === null || err === void 0 ? void 0 : err.message);
        }
    });
}
