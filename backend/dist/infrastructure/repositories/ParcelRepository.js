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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parcelRepository = exports.ParcelRepository = void 0;
const Parcel_1 = require("../../domain/entities/Parcel");
class ParcelRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.create(data);
        });
    }
    findAll(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {};
            if (filters === null || filters === void 0 ? void 0 : filters.status)
                query.status = filters.status;
            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                query.$or = [
                    { trackingNumber: { $regex: filters.search, $options: 'i' } },
                    { customerName: { $regex: filters.search, $options: 'i' } },
                    { orderId: { $regex: filters.search, $options: 'i' } },
                ];
            }
            return Parcel_1.Parcel.find(query).sort({ createdAt: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.findById(id);
        });
    }
    findByTrackingNumber(trackingNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.findOne({ trackingNumber });
        });
    }
    findByOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.find({ orderId }).sort({ createdAt: -1 });
        });
    }
    findActiveDeliveries() {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.find({
                status: { $nin: ['delivered', 'failed'] },
            }).sort({ updatedAt: 1 });
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Parcel_1.Parcel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Parcel_1.Parcel.findByIdAndDelete(id);
        });
    }
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Parcel_1.Parcel.aggregate([
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
            results.forEach((r) => {
                const key = r._id;
                if (key in stats) {
                    stats[key] = r.count;
                }
                stats.total += r.count;
            });
            return stats;
        });
    }
    getRecentActivity() {
        return __awaiter(this, arguments, void 0, function* (limit = 5) {
            return Parcel_1.Parcel.find().sort({ updatedAt: -1 }).limit(limit);
        });
    }
}
exports.ParcelRepository = ParcelRepository;
exports.parcelRepository = new ParcelRepository();
