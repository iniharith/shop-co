"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.startTaskAutoTransitionJob = startTaskAutoTransitionJob;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const node_cron_1 = __importDefault(require("node-cron"));
const Task_1 = require("../../domain/entities/Task");
const taskBroadcast_1 = require("../../shared/utils/taskBroadcast");
const Parcel_1 = require("../../domain/entities/Parcel");
const PACKAGING_TO_DELIVERED_DAYS = 14;
/**
 * Reconciles old packaging tasks only after parcel tracking confirms delivery.
 */
function startTaskAutoTransitionJob() {
    console.log(`[Cron] 🕐 Task auto-transition job registered (runs daily at 2 AM)`);
    console.log(`[Cron]    Tasks in PACKAGING for >${PACKAGING_TO_DELIVERED_DAYS} days → DELIVERED`);
    // Run immediately on startup
    transitionPackagingToDelivered();
    // Then every day at 2 AM
    node_cron_1.default.schedule('0 2 * * *', () => {
        transitionPackagingToDelivered();
    });
}
function transitionPackagingToDelivered() {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        console.log(`[Cron] 🔄 Task auto-transition started at ${new Date().toISOString()}`);
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - PACKAGING_TO_DELIVERED_DAYS);
            const stuckTasks = yield Task_1.Task.find({
                status: 'PACKAGING',
                isDeleted: { $ne: true },
                statusUpdatedAt: { $lte: cutoffDate },
            }).lean();
            if (stuckTasks.length === 0) {
                console.log('[Cron] ✅ No tasks to transition');
                return;
            }
            console.log(`[Cron] Found ${stuckTasks.length} task(s) in PACKAGING for >${PACKAGING_TO_DELIVERED_DAYS} days`);
            let successCount = 0;
            let errorCount = 0;
            for (const task of stuckTasks) {
                try {
                    const taskId = task._id.toString();
                    const orderId = task.orderId;
                    if (!orderId || !(yield Parcel_1.Parcel.exists({ orderId: orderId.toString(), status: 'delivered' }))) {
                        console.log(`[Cron] Skipping "${task.title}" because parcel delivery is not confirmed`);
                        continue;
                    }
                    // Update task status only after the provider-backed Parcel is delivered.
                    yield Task_1.Task.findByIdAndUpdate(taskId, {
                        $set: {
                            status: 'DELIVERED',
                            statusUpdatedAt: new Date(),
                        },
                    });
                    // Sync to linked order
                    if (orderId) {
                        const { OrderUsecase } = yield Promise.resolve().then(() => __importStar(require('../../application/usecases/orders/order.usecase')));
                        const orderUsecase = new OrderUsecase();
                        yield orderUsecase.updateOrderStatus(orderId, 'DELIVERED', false, taskId);
                    }
                    // Log activity
                    const { Task: TaskModel } = yield Promise.resolve().then(() => __importStar(require('../../domain/entities/Task')));
                    yield TaskModel.findByIdAndUpdate(taskId, {
                        $push: {
                            activities: {
                                userId: 'system',
                                userName: 'System',
                                action: `auto-transitioned from PACKAGING to DELIVERED (after ${PACKAGING_TO_DELIVERED_DAYS} days)`,
                                details: '',
                                createdAt: new Date(),
                            },
                        },
                    });
                    const updatedTask = yield Task_1.Task.findById(taskId);
                    void (0, taskBroadcast_1.emitTaskUpdated)('task_updated', { task: updatedTask });
                    successCount++;
                    console.log(`[Cron] ✅ Task "${task.title}" → DELIVERED`);
                }
                catch (err) {
                    errorCount++;
                    console.error(`[Cron] ❌ Error transitioning task "${task.title}":`, err === null || err === void 0 ? void 0 : err.message);
                }
            }
            const elapsed = Date.now() - startTime;
            console.log(`[Cron] ✅ Auto-transition complete in ${elapsed}ms — ` +
                `Transitioned: ${successCount}, Errors: ${errorCount}`);
        }
        catch (err) {
            console.error('[Cron] ❌ Fatal error in task auto-transition:', err === null || err === void 0 ? void 0 : err.message);
        }
    });
}
