/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { VirtualFolder, IVirtualFolder } from '../../domain/entities/VirtualFolder';

class VirtualFolderRepository {
  async create(data: Partial<IVirtualFolder>): Promise<IVirtualFolder> {
    const folder = new VirtualFolder(data);
    return await folder.save();
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
    return await VirtualFolder.findByIdAndDelete(id);
  }
}

export const virtualFolderRepository = new VirtualFolderRepository();
