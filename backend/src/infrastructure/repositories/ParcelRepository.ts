/**
 * Coded by Harith
 * Kampungcetak ®
 */
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

  async findByShipmentId(shipmentId: string): Promise<IParcel | null> {
    return Parcel.findOne({ easyparcelShipmentId: shipmentId });
  }

  async findByOrderId(orderId: string): Promise<IParcel[]> {
    return Parcel.find({ orderId }).sort({ createdAt: -1 });
  }

  async upsertByOrderId(orderId: string, data: Partial<IParcel>): Promise<IParcel> {
    const setData: Partial<IParcel> = { ...data, orderId };
    const update: Record<string, any> = { $set: setData };
    if (Object.prototype.hasOwnProperty.call(data, 'trackingNumber') && !data.trackingNumber) {
      delete setData.trackingNumber;
      update.$unset = { trackingNumber: 1 };
    }
    return Parcel.findOneAndUpdate(
      { orderId },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  async findActiveDeliveries(): Promise<IParcel[]> {
    return Parcel.find({
      status: { $nin: ['delivered', 'failed', 'cancelled', 'returned'] },
    }).sort({ updatedAt: 1 });
  }

  async update(id: string, data: Partial<IParcel>): Promise<IParcel | null> {
    const setData = { ...data };
    const update: Record<string, any> = { $set: setData };
    if (Object.prototype.hasOwnProperty.call(data, 'trackingNumber') && !data.trackingNumber) {
      delete setData.trackingNumber;
      update.$unset = { trackingNumber: 1 };
    }
    return Parcel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async updateProviderStatus(id: string, observedAt: Date, data: Partial<IParcel>): Promise<IParcel | null> {
    return Parcel.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { providerStatusUpdatedAt: { $exists: false } },
          { providerStatusUpdatedAt: { $lt: observedAt } },
        ],
      },
      { $set: { ...data, providerStatusUpdatedAt: observedAt } },
      { new: true, runValidators: true }
    );
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
