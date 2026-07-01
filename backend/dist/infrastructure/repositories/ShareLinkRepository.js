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
exports.shareLinkRepository = exports.ShareLinkRepository = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const ShareLink_1 = require("../../domain/entities/ShareLink");
const slugify = (input) => input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'customer';
class ShareLinkRepository {
    // Finds an existing link for the same folder criteria, or creates a new
    // short slug based on the customer/folder name (e.g. "ahmad-ali", "ahmad-ali-2").
    findOrCreate(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { folderName, taskId, orderId, userId, folderId } = params;
            // IMPORTANT: only reuse an existing link if we have a real identifier to
            // match on. An empty {} query would match the FIRST document in the
            // entire collection, silently handing back an unrelated customer's link.
            let existing = null;
            if (folderId)
                existing = yield ShareLink_1.ShareLink.findOne({ folderId });
            else if (taskId)
                existing = yield ShareLink_1.ShareLink.findOne({ taskId });
            else if (orderId)
                existing = yield ShareLink_1.ShareLink.findOne({ orderId });
            else if (userId)
                existing = yield ShareLink_1.ShareLink.findOne({ userId });
            if (existing) {
                if (existing.folderName !== folderName) {
                    existing.folderName = folderName;
                    yield existing.save();
                }
                return existing;
            }
            const base = slugify(folderName);
            let slug = base;
            let counter = 2;
            while (yield ShareLink_1.ShareLink.exists({ slug })) {
                slug = `${base}-${counter}`;
                counter++;
            }
            return ShareLink_1.ShareLink.create({ slug, folderName, taskId, orderId, userId, folderId });
        });
    }
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return ShareLink_1.ShareLink.findOne({ slug });
        });
    }
}
exports.ShareLinkRepository = ShareLinkRepository;
exports.shareLinkRepository = new ShareLinkRepository();
