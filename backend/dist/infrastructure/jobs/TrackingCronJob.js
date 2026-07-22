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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const node_cron_1 = __importDefault(require("node-cron"));
const ParcelRepository_1 = require("../repositories/ParcelRepository");
const EasyParcelTrackingSyncService_1 = require("../services/EasyParcelTrackingSyncService");
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
            const result = yield (0, EasyParcelTrackingSyncService_1.syncParcelTracking)(activeParcels);
            const elapsed = Date.now() - startTime;
            console.log(`[Cron] ✅ Sync complete in ${elapsed}ms — ` +
                `Updated: ${result.updated}, AWBs reconciled: ${result.reconciled}, WhatsApp sent: ${result.notified}`);
        }
        catch (err) {
            console.error('[Cron] ❌ Fatal error in parcel sync:', err === null || err === void 0 ? void 0 : err.message);
        }
    });
}
