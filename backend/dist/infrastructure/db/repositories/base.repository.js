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
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.find().lean();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findById(id);
        });
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findOne({ userId });
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.create(data);
        });
    }
    updateById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndUpdate(id, data, { new: true });
        });
    }
    updateOne(filter, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findOneAndUpdate(filter, data, { new: true });
        });
    }
    updateMany(filter, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.updateMany(filter, data);
        });
    }
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndDelete(id);
        });
    }
    upsert(filter, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findOneAndUpdate(filter, data, { new: true, upsert: true });
        });
    }
}
exports.BaseRepository = BaseRepository;
