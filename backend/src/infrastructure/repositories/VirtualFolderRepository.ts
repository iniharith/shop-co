/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { VirtualFolder, IVirtualFolder } from '../../domain/entities/VirtualFolder';
import { RedisService } from '../redis/redis';
import { REDIS_CHANNELS } from '../../shared/constants/redis.constant';
import { getAdminNamespace } from '../socket/socketRegistry';

const redisService = new RedisService();
const notifyClients = () => {
  const adminNamespace = getAdminNamespace();
  if (adminNamespace) {
    try {
      adminNamespace.emit('files_updated', { action: 'update' });
    } catch (e) {
      console.error('Failed to emit files socket event locally:', e);
    }
  }
  return redisService.publish(REDIS_CHANNELS.FILES_UPDATED, JSON.stringify({ action: 'update' })).catch(console.error);
};

class VirtualFolderRepository {
  async create(data: Partial<IVirtualFolder>): Promise<IVirtualFolder> {
    const folder = new VirtualFolder(data);
    const result = await folder.save();
    notifyClients();
    return result;
  }

  async findAll(): Promise<IVirtualFolder[]> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return await VirtualFolder.find({ createdAt: { $gte: sixtyDaysAgo } }).sort({ createdAt: -1 }).lean() as unknown as Promise<IVirtualFolder[]>;
  }

  async findById(id: string): Promise<IVirtualFolder | null> {
    return await VirtualFolder.findById(id);
  }

  async delete(id: string): Promise<IVirtualFolder | null> {
    const result = await VirtualFolder.findByIdAndDelete(id);
    notifyClients();
    return result;
  }

  async update(id: string, data: Partial<IVirtualFolder>): Promise<IVirtualFolder | null> {
    const result = await VirtualFolder.findByIdAndUpdate(id, { $set: data }, { new: true });
    notifyClients();
    return result;
  }
}

export const virtualFolderRepository = new VirtualFolderRepository();
