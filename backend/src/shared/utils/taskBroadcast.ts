/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { RedisService } from '../../infrastructure/redis/redis';
import { REDIS_CHANNELS } from '../constants/redis.constant';

const redisService = new RedisService();

// ── Helper: broadcast a task change to every admin tab in real-time ──────────
// Consumed on the frontend by socketProvider.tsx's "task_updated" listener,
// which patches the ["tasks"] and ["task", id] React Query caches directly.
//
// Payload shapes expected by the frontend:
//   task_created / task_updated → { task: <full task object> }
//   task_deleted                → { taskId: <string id> }
export const emitTaskUpdated = async (
  event: 'task_updated' | 'task_created' | 'task_deleted',
  payload: { task?: any; taskId?: string }
) => {
  try {
    await redisService.publish(REDIS_CHANNELS.TASK_UPDATED, JSON.stringify({ event, ...payload }));
  } catch (e) {
    console.error('Failed to emit task socket event:', e);
  }
};
