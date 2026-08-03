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
exports.warmPdfSharePreview = void 0;
const publicBackendUrl = (process.env.PUBLIC_BACKEND_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "") ||
    "https://shop-co-production.up.railway.app").replace(/\/$/, "");
const previewJobs = new Map();
const isPdfFile = (file) => /^application\/pdf(?:$|;)/i.test(file.mimetype || "") || /\.pdf$/i.test(file.originalName || "");
const buildPdfSharePreviewUrl = (fileId) => {
    const sourceUrl = `${publicBackendUrl}/api/files/${encodeURIComponent(fileId)}/preview`;
    const previewUrl = new URL("https://wsrv.nl/");
    previewUrl.searchParams.set("url", sourceUrl);
    previewUrl.searchParams.set("page", "0");
    previewUrl.searchParams.set("n", "1");
    previewUrl.searchParams.set("w", "1200");
    previewUrl.searchParams.set("h", "630");
    previewUrl.searchParams.set("fit", "contain");
    previewUrl.searchParams.set("cbg", "white");
    previewUrl.searchParams.set("output", "jpg");
    previewUrl.searchParams.set("q", "80");
    previewUrl.searchParams.set("maxage", "1y");
    return previewUrl.toString();
};
const warmPdfSharePreview = (file) => {
    var _a;
    const fileId = ((_a = file._id) === null || _a === void 0 ? void 0 : _a.toString()) || file.id;
    if (!fileId || !isPdfFile(file) || previewJobs.has(fileId))
        return;
    const job = fetch(buildPdfSharePreviewUrl(fileId))
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (!response.ok || ((_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.startsWith("image/")) !== true) {
            throw new Error(`PDF preview returned ${response.status}`);
        }
        yield response.arrayBuffer();
    }))
        .catch((error) => {
        console.warn(`[PDF Preview] Could not warm preview for ${fileId}:`, error);
    })
        .finally(() => previewJobs.delete(fileId));
    previewJobs.set(fileId, job);
};
exports.warmPdfSharePreview = warmPdfSharePreview;
