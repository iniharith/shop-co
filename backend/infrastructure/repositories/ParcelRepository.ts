import { Parcel, IParcel } from '../../domain/entities/Parcel';

export class ParcelRepository {
  async create(data: Partial<IParcel>): Promise<IParcel> {
    return Parcel.create(data);
  }

  async findAll(filters?: { status?: string; search?: string }): Promise<IParcel[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { trackingNumber: { $regex: filters.search, $options: 'i' } },
        { customerName: { $regex: filters.search, $options: 'i' } },
        { orderId: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return Parcel.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IParcel | null> {
    return Parcel.findById(id);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<IParcel | null> {
    return Parcel.findOne({ trackingNumber });
  }

  async findByOrderId(orderId: string): Promise<IParcel[]> {
    return Parcel.find({ orderId }).sort({ createdAt: -1 });
  }

  async findActiveDeliveries(): Promise<IParcel[]> {
    return Parcel.find({
      status: { $nin: ['delivered', 'failed'] },
    }).sort({ updatedAt: 1 });
  }

  async update(id: string, data: Partial<IParcel>): Promise<IParcel | null> {
    return Parcel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<void> {
    await Parcel.findByIdAndDelete(id);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    picked_up: number;
    in_transit: number;
    out_for_delivery: number;
    delivered: number;
    failed: number;
  }> {
    const results = await Parcel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = {
      total: 0,
      pending: 0,
      picked_up: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      failed: 0,
    };

    results.forEach((r: { _id: string; count: number }) => {
      const key = r._id as keyof typeof stats;
      if (key in stats) {
        stats[key] = r.count;
      }
      stats.total += r.count;
    });

    return stats;
  }

  async getRecentActivity(limit = 5): Promise<IParcel[]> {
    return Parcel.find().sort({ updatedAt: -1 }).limit(limit);
  }
}

export const parcelRepository = new ParcelRepository();
