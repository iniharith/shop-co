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
    return await VirtualFolder.find().sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IVirtualFolder | null> {
    return await VirtualFolder.findById(id);
  }

  async delete(id: string): Promise<IVirtualFolder | null> {
    return await VirtualFolder.findByIdAndDelete(id);
  }
}

export const virtualFolderRepository = new VirtualFolderRepository();
