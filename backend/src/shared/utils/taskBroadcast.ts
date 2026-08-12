/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_CHANNELS } from '../constants/redis.constant';
import { getAdminNamespace } from '../../infrastructure/socket/socketRegistry';

const redisService = new RedisService();

// ── Helper: broadcast a task change to every admin tab in real-time ──────────
// Consumed on the frontend by socketProvider.tsx's "task_updated" listener,
// which patches the ["tasks"] and ["task", id] React Query caches directly.
//
// Emits directly on the local /admin socket namespace so a single Railway
// instance stays real-time even if Redis is down; the Redis publish is kept
// for multi-instance fan-out.
//
// Payload shapes expected by the frontend:
//   task_created / task_updated → { task: <full task object> }
//   task_deleted                → { taskId: <string id> }
export const emitTaskUpdated = async (
  event: 'task_updated' | 'task_created' | 'task_deleted',
  payload: { task?: any; taskId?: string }
) => {
  const message = { event, ...payload };
  const adminNamespace = getAdminNamespace();
  if (adminNamespace) {
    try {
      adminNamespace.emit(event, message);
    } catch (e) {
      console.error('Failed to emit task socket event locally:', e);
    }
  }
  try {
    await redisService.publish(REDIS_CHANNELS.TASK_UPDATED, JSON.stringify(message));
  } catch (e) {
    console.error('Failed to emit task socket event:', e);
  }
};
