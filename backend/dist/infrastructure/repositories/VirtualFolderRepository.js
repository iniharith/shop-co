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
exports.virtualFolderRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const VirtualFolder_1 = require("../../domain/entities/VirtualFolder");
class VirtualFolderRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = new VirtualFolder_1.VirtualFolder(data);
            return yield folder.save();
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return yield VirtualFolder_1.VirtualFolder.find({ createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).lean();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield VirtualFolder_1.VirtualFolder.findById(id);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield VirtualFolder_1.VirtualFolder.findByIdAndDelete(id);
        });
    }
}
exports.virtualFolderRepository = new VirtualFolderRepository();
