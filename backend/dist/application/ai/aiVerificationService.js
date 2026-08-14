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
exports.buildExpectedDetails = buildExpectedDetails;
exports.verifyUploadedFile = verifyUploadedFile;
exports.verifyFileUploadById = verifyFileUploadById;
/**
 * Coded by Harith
 * Kampungcetak ®
 * Scans an uploaded file, extracts its text, and compares it against the
 * linked order/task details (customer name, item, size, quantity, phone,
 * address). Returns human-readable issues when the file looks wrong.
 */
const axios_1 = __importDefault(require("axios"));
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const openaiClient_1 = require("../../infrastructure/ai/openaiClient");
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
function downloadFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield axios_1.default.get(path, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: MAX_DOWNLOAD_BYTES,
                maxBodyLength: MAX_DOWNLOAD_BYTES,
            });
            return Buffer.from(res.data);
        }
        catch (err) {
            console.error('[ai] failed to download file for verification:', err.message);
            return null;
        }
    });
}
function buildExpectedDetails(order, tasks, notes) {
    var _a;
    const products = Array.isArray(order.products)
        ? order.products.map((p) => `- ${p.productNameSnapshot || p.product || 'item'} | Saiz: ${p.size} | Kuantiti: ${p.quantity}`).join('\n')
        : '';
    const manualItem = order.manualItemName
        ? `- ${order.manualItemName}${order.manualItemDescription ? ` (${order.manualItemDescription})` : ''}`
        : '';
    const addr = order.address
        ? `${order.address.address}, ${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}`
        : '';
    const taskSpecs = tasks
        .filter((t) => !t.isDeleted)
        .map((t) => `Task: ${t.title}\n${t.description || ''}`)
        .join('\n\n');
    return [
        `Nama pelanggan: ${order.customerName || 'N/A'}`,
        `ID pesanan: ${((_a = order._id) === null || _a === void 0 ? void 0 : _a.toString()) || 'N/A'}`,
        products || manualItem ? `Item dipesan:\n${[products, manualItem].filter(Boolean).join('\n')}` : 'Item dipesan: N/A',
        addr ? `Alamat: ${addr}` : '',
        order.orderNotes ? `Nota pelanggan: ${order.orderNotes}` : '',
        notes ? `Nota pada muat naik: ${notes}` : '',
        taskSpecs ? `Spesifikasi tugas:\n${taskSpecs}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}
/**
 * Verifies one uploaded file against the order + linked tasks.
 * Mirrors the ownership checks used elsewhere: the caller decides access.
 */
function verifyUploadedFile(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const empty = {
            ok: true,
            issues: [],
            summary: 'Pengesahan tidak dapat dijalankan.',
            textExtracted: null,
        };
        if (!(0, openaiClient_1.aiConfigured)())
            return empty;
        const { file, orderId, taskId, notes } = opts;
        let order = null;
        if (orderId) {
            try {
                order = yield order_model_1.default.findById(orderId).lean();
            }
            catch (err) {
                console.error('[ai] failed to load order:', err.message);
            }
        }
        let tasks = [];
        try {
            const taskFilter = {};
            if (taskId)
                taskFilter._id = taskId;
            else if (orderId)
                taskFilter.orderId = orderId;
            else
                return empty;
            tasks = yield Task_1.Task.find(taskFilter).lean();
        }
        catch (err) {
            console.error('[ai] failed to load tasks:', err.message);
        }
        // A customer upload without an order has nothing to compare against.
        if (!order && tasks.length === 0) {
            return Object.assign(Object.assign({}, empty), { summary: 'Tiada butiran pesanan untuk perbandingan.' });
        }
        const buffer = yield downloadFile(file.path);
        if (!buffer) {
            return Object.assign(Object.assign({}, empty), { summary: 'Fail tidak dapat dimuat turun untuk disemak.' });
        }
        const textExtracted = yield (0, openaiClient_1.extractTextFromBuffer)(buffer, file.mimetype, file.originalName);
        // Non-parseable (e.g. raw vector/design files) — nothing to compare.
        if (!textExtracted.trim()) {
            return Object.assign(Object.assign({}, empty), { textExtracted: null, summary: 'Tiada teks boleh diekstrak daripada fail.' });
        }
        const expected = buildExpectedDetails(order, tasks, notes);
        const system = [
            'You are a print-shop QC assistant for KAMPUNG CETAK.',
            'A customer uploaded a file against an order. Compare the text extracted from the uploaded file with the expected order/task details.',
            'Detect mismatches ONLY when the file clearly contradicts the expected details (e.g. different customer name, wrong item, wrong size, wrong quantity, wrong address/phone).',
            'Ignore minor formatting differences. Do not invent issues.',
            'Reply ONLY with JSON:',
            '{"issues": [{"field": "Nama", "found": "...", "expected": "...", "severity": "error|warning", "explanation": "..."}], "summary": "One short sentence in Bahasa Melayu", "ok": true|false}',
            '"ok" is false only when at least one severity="error" issue exists.',
        ].join(' ');
        const user = [
            `Nama fail: ${file.originalName}`,
            `Jenis fail: ${file.mimetype}`,
            '',
            '=== BUTIRAN YANG DIJANGKA (ORDER/TASK) ===',
            expected,
            '',
            '=== TEKS YANG DIEKSTRAK DARIPADA FAIL ===',
            textExtracted.slice(0, 20000),
        ].join('\n');
        try {
            const result = yield (0, openaiClient_1.generateJson)(system, user, { maxTokens: 2048 });
            const issues = Array.isArray(result.issues) ? result.issues.slice(0, 10) : [];
            const safeIssues = issues.map((i) => {
                var _a, _b;
                return ({
                    field: String(i.field || 'Lain-lain').slice(0, 60),
                    found: String((_a = i.found) !== null && _a !== void 0 ? _a : '').slice(0, 200),
                    expected: String((_b = i.expected) !== null && _b !== void 0 ? _b : '').slice(0, 200),
                    severity: i.severity === 'error' ? 'error' : 'warning',
                    explanation: String(i.explanation || '').slice(0, 300),
                });
            });
            return {
                ok: safeIssues.every((i) => i.severity !== 'error'),
                issues: safeIssues,
                summary: (result.summary || 'Pengesahan selesai.').slice(0, 300),
                textExtracted: textExtracted.slice(0, 5000),
            };
        }
        catch (err) {
            console.error('[ai] verification LLM call failed:', err.message);
            return Object.assign(Object.assign({}, empty), { summary: 'Pengesahan gagal dilaksanakan.', textExtracted });
        }
    });
}
/** Convenience: verify an already-saved FileUpload doc by id. */
function verifyFileUploadById(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield FileUpload_1.FileUpload.findById(fileId).lean();
        if (!doc) {
            return { ok: true, issues: [], summary: 'Fail tidak dijumpai.', textExtracted: null };
        }
        return verifyUploadedFile({
            file: { path: doc.path, originalName: doc.originalName, mimetype: doc.mimetype },
            orderId: doc.orderId,
            taskId: doc.taskId,
            notes: doc.notes,
        });
    });
}
