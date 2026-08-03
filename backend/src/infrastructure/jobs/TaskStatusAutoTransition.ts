/**
 * Coded by Harith
 * Kampungcetak ®
 */
import cron from 'node-cron';
import { Task } from '../../domain/entities/Task';
import { emitTaskUpdated } from '../../shared/utils/taskBroadcast';
import { Parcel } from '../../domain/entities/Parcel';
import { taskRepository } from '../repositories/TaskRepository';

const PACKAGING_TO_DELIVERED_DAYS = 14;

/**
 * Reconciles old packaging tasks only after parcel tracking confirms delivery.
 */
export function startTaskAutoTransitionJob(): void {
  console.log(`[Cron] 🕐 Task auto-transition job registered (runs daily at 2 AM)`);
  console.log(`[Cron]    Tasks in PACKAGING for >${PACKAGING_TO_DELIVERED_DAYS} days → DELIVERED`);

  // Run immediately on startup
  transitionPackagingToDelivered();

  // Then every day at 2 AM
  cron.schedule('0 2 * * *', () => {
    transitionPackagingToDelivered();
  });
}

async function transitionPackagingToDelivered(): Promise<void> {
  const startTime = Date.now();
  console.log(`[Cron] 🔄 Task auto-transition started at ${new Date().toISOString()}`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PACKAGING_TO_DELIVERED_DAYS);

    const stuckTasks = await Task.find({
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
        const taskId = (task as any)._id.toString();
        const orderId = (task as any).orderId;

        if (!orderId || !await Parcel.exists({ orderId: orderId.toString(), status: 'delivered' })) {
          console.log(`[Cron] Skipping "${task.title}" because parcel delivery is not confirmed`);
          continue;
        }

        // Update task status only after the provider-backed Parcel is delivered.
        await taskRepository.update(taskId, { status: 'DELIVERED' });

        // Sync to linked order
        if (orderId) {
          const { OrderUsecase } = await import('../../application/usecases/orders/order.usecase');
          const orderUsecase = new OrderUsecase();
          await orderUsecase.updateOrderStatus(orderId, 'DELIVERED', false, taskId);
        }

        // Log activity
        await taskRepository.addActivity(
          taskId,
          'system',
          'System',
          `auto-transitioned from PACKAGING to DELIVERED (after ${PACKAGING_TO_DELIVERED_DAYS} days)`,
        );

        const updatedTask = await Task.findById(taskId);
        void emitTaskUpdated('task_updated', { task: updatedTask });

        successCount++;
        console.log(`[Cron] ✅ Task "${task.title}" → DELIVERED`);
      } catch (err: any) {
        errorCount++;
        console.error(`[Cron] ❌ Error transitioning task "${task.title}":`, err?.message);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Cron] ✅ Auto-transition complete in ${elapsed}ms — ` +
        `Transitioned: ${successCount}, Errors: ${errorCount}`
    );
  } catch (err: any) {
    console.error('[Cron] ❌ Fatal error in task auto-transition:', err?.message);
  }
}
