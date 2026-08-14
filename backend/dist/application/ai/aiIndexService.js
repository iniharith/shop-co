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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_COLLECTIONS = void 0;
exports.chunkText = chunkText;
exports.indexTask = indexTask;
exports.indexFile = indexFile;
exports.indexProduct = indexProduct;
exports.reindexAll = reindexAll;
/**
 * Coded by Harith
 * Kampungcetak ®
 * Chunks + embeds MongoDB documents (products, tasks, files) into pgvector.
 */
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const pgVectorStore_1 = require("../../infrastructure/vector/pgVectorStore");
const aiProvider_1 = require("../../infrastructure/ai/aiProvider");
exports.AI_COLLECTIONS = {
    products: 'products',
    tasks: 'tasks',
    files: 'files',
};
const CHUNK_SIZE = 800;
function chunkText(text, size = CHUNK_SIZE) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean)
        return [];
    const chunks = [];
    for (let i = 0; i < clean.length; i += size) {
        chunks.push(clean.slice(i, i + size));
    }
    return chunks;
}
function safeMetadata(obj) {
    try {
        return JSON.parse(JSON.stringify(obj || {}));
    }
    catch (_a) {
        return {};
    }
}
function indexEntity(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, aiProvider_1.aiConfigured)())
            return;
        const chunks = chunkText(input.text);
        const metadata = safeMetadata(input.metadata);
        if (chunks.length === 0) {
            // Keep a stub row so counts/recently-indexed are meaningful even for
            // entities without searchable text (e.g. binary-only uploads).
            yield pgVectorStore_1.pgVectorStore.upsertBatch(input.collection, [
                { entityId: input.entityId, chunkIndex: 0, text: input.text || '', metadata, embedding: new Array(aiProvider_1.EMBEDDING_DIM).fill(0) },
            ]);
            return;
        }
        const embeddings = yield (0, aiProvider_1.embedTexts)(chunks);
        yield pgVectorStore_1.pgVectorStore.upsertBatch(input.collection, chunks.map((chunk, i) => ({
            entityId: input.entityId,
            chunkIndex: i,
            text: chunk,
            metadata,
            embedding: embeddings[i],
        })));
    });
}
function indexTask(task) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(task === null || task === void 0 ? void 0 : task._id) || !(0, aiProvider_1.aiConfigured)())
            return;
        const text = [
            task.title,
            task.description,
            task.customerUsername && `Pelanggan: ${task.customerUsername}`,
            task.orderId && `Order ID: ${task.orderId}`,
            task.category && `Kategori: ${task.category}`,
            task.productName && `Produk: ${task.productName}`,
            task.status && `Status: ${task.status}`,
        ]
            .filter(Boolean)
            .join('\n');
        yield indexEntity({
            collection: exports.AI_COLLECTIONS.tasks,
            entityId: task._id.toString(),
            text,
            metadata: {
                id: task._id.toString(),
                title: task.title,
                status: task.status,
                category: task.category,
                orderId: task.orderId,
                customerUsername: task.customerUsername,
                productName: task.productName,
                updatedAt: task.updatedAt || new Date().toISOString(),
            },
        });
    });
}
function indexFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(file === null || file === void 0 ? void 0 : file._id) || !(0, aiProvider_1.aiConfigured)())
            return;
        const text = [
            file.originalName,
            file.notes,
            file.category && `Kategori: ${file.category}`,
            file.orderId && `Order ID: ${file.orderId}`,
            file.taskId && `Task ID: ${file.taskId}`,
        ]
            .filter(Boolean)
            .join('\n');
        yield indexEntity({
            collection: exports.AI_COLLECTIONS.files,
            entityId: file._id.toString(),
            text,
            metadata: {
                id: file._id.toString(),
                originalName: file.originalName,
                mimetype: file.mimetype,
                category: file.category,
                orderId: file.orderId,
                taskId: file.taskId,
                path: file.path,
                adminReviewed: Boolean(file.adminReviewed),
                uploadedAt: file.uploadedAt || new Date().toISOString(),
            },
        });
    });
}
function indexProduct(product) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(product === null || product === void 0 ? void 0 : product._id) || !(0, aiProvider_1.aiConfigured)())
            return;
        const sizes = Array.isArray(product.sizes)
            ? product.sizes.map((s) => s.size || s).filter(Boolean).join(', ')
            : '';
        const text = [
            product.name,
            product.description,
            product.category && `Kategori: ${product.category}`,
            sizes && `Saiz: ${sizes}`,
            product.price != null && `Harga: RM ${product.price}`,
        ]
            .filter(Boolean)
            .join('\n');
        yield indexEntity({
            collection: exports.AI_COLLECTIONS.products,
            entityId: product._id.toString(),
            text,
            metadata: {
                id: product._id.toString(),
                name: product.name,
                category: product.category,
                price: product.price,
                image: Array.isArray(product.images) ? product.images[0] : undefined,
                rating: product.rating,
            },
        });
    });
}
function forEachEntity(model, filter, batchSize, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        let count = 0;
        let cursor = null;
        for (;;) {
            const query = Object.assign({}, filter);
            if (cursor)
                query._id = { $gt: cursor };
            const docs = yield model.find(query).sort({ _id: 1 }).limit(batchSize).lean();
            if (docs.length === 0)
                break;
            for (const doc of docs) {
                yield fn(doc);
                count += 1;
            }
            cursor = docs[docs.length - 1]._id;
        }
        return count;
    });
}
function reindexAll() {
    return __awaiter(this, arguments, void 0, function* (opts = {}) {
        var _a, _b, _c;
        if (!(0, aiProvider_1.aiConfigured)())
            throw new Error('AI is not configured');
        yield pgVectorStore_1.pgVectorStore.initSchema();
        const report = { products: 0, tasks: 0, files: 0 };
        (_a = opts.onProgress) === null || _a === void 0 ? void 0 : _a.call(opts, 'Mengindeks produk...');
        report.products = yield forEachEntity(product_model_1.default, { isDelete: { $ne: true } }, 20, indexProduct);
        (_b = opts.onProgress) === null || _b === void 0 ? void 0 : _b.call(opts, 'Mengindeks task...');
        report.tasks = yield forEachEntity(Task_1.Task, { isDeleted: { $ne: true } }, 20, indexTask);
        (_c = opts.onProgress) === null || _c === void 0 ? void 0 : _c.call(opts, 'Mengindeks fail...');
        report.files = yield forEachEntity(FileUpload_1.FileUpload, {}, 20, indexFile);
        return report;
    });
}
