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
exports.hashPrintSecret = exports.AwbPrintError = void 0;
exports.validatePrintPlan = validatePrintPlan;
exports.validatePrintReceipts = validatePrintReceipts;
exports.createAwbPrintJob = createAwbPrintJob;
exports.confirmAwbPrintJob = confirmAwbPrintJob;
const crypto_1 = require("crypto");
const AwbPrintJob_1 = require("../../domain/entities/AwbPrintJob");
const Task_1 = require("../../domain/entities/Task");
const taskAwbManifest_1 = require("./taskAwbManifest");
class AwbPrintError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.AwbPrintError = AwbPrintError;
const hashPrintSecret = (secret) => (0, crypto_1.createHash)('sha256').update(secret).digest('hex');
exports.hashPrintSecret = hashPrintSecret;
const closed = ['CANCELLED', 'FAILED', 'RETURN', 'DELIVERED', 'IN_TRANSIT'];
function validatePrintPlan(manifest, values) {
    if (!Array.isArray(values) || !values.length || values.length > 25 || values.length !== manifest.labels.length)
        throw new AwbPrintError(400, 'The print job must include every AWB attached to this task');
    const used = new Set();
    let pageCount = 0;
    for (const label of values) {
        if (!label || typeof label.id !== 'string' || typeof label.version !== 'string'
            || !Number.isInteger(label.pages) || label.pages < 1 || label.pages > 10 || used.has(label.id))
            throw new AwbPrintError(400, 'Invalid AWB page plan');
        const expected = manifest.labels.find((item) => item.id === label.id && item.version === label.version);
        if (!expected)
            throw new AwbPrintError(409, 'AWB changed. Scan the task again before printing');
        used.add(label.id);
        pageCount += label.pages;
    }
    if (pageCount > 100)
        throw new AwbPrintError(400, 'Too many AWB pages in one job');
    return values.map(label => ({ id: label.id, version: label.version, pages: label.pages }));
}
// Gprinter TSPL SET RESPONSE "ID",ON emits this frame AFTER each label.
// A ready byte, a socket write, OK, or a reply for another page is not proof.
function validatePrintReceipts(tags, receipts) {
    if (!Array.isArray(receipts) || receipts.length !== tags.length || !tags.length)
        throw new AwbPrintError(409, 'Every AWB page needs printer completion confirmation');
    return tags.map((tag, index) => {
        const receipt = receipts[index];
        if (typeof receipt !== 'string' || receipt !== `{00,00001,${tag}}`)
            throw new AwbPrintError(409, 'Printer completion confirmation is missing or does not match this job');
        return receipt;
    });
}
function createAwbPrintJob(token, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, taskAwbManifest_1.isTaskAwbToken)(token))
            throw new AwbPrintError(400, 'Invalid task QR');
        if (typeof (input === null || input === void 0 ? void 0 : input.printer) !== 'string' || !input.printer.trim() || input.printer.length > 100)
            throw new AwbPrintError(400, 'Select the AWB printer');
        const task = yield Task_1.Task.findOne({ qrToken: token.toLowerCase(), isDeleted: { $ne: true } }).select('_id status awbPrintJobIds').lean();
        if (!task)
            throw new AwbPrintError(404, 'Task not found');
        if (closed.includes(task.status))
            throw new AwbPrintError(409, 'Task is closed or already with the courier');
        const manifest = yield (0, taskAwbManifest_1.taskAwbManifest)(token);
        if (!manifest || !manifest.labels.length)
            throw new AwbPrintError(409, 'This task has no AWB to print');
        const labels = validatePrintPlan(manifest, input.labels);
        const secret = (0, crypto_1.randomBytes)(24).toString('hex');
        const pages = labels.flatMap(label => Array.from({ length: label.pages }, () => (0, crypto_1.randomBytes)(8).toString('hex')));
        const job = yield AwbPrintJob_1.AwbPrintJob.create({ taskId: String(task._id), secretHash: (0, exports.hashPrintSecret)(secret), printer: input.printer.trim(), labels, pages });
        return { id: String(job._id), secret, pages };
    });
}
function confirmAwbPrintJob(token_1, id_1, input_1) {
    return __awaiter(this, arguments, void 0, function* (token, id, input, getManifest = taskAwbManifest_1.taskAwbManifest) {
        if (!(0, taskAwbManifest_1.isTaskAwbToken)(token) || typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)
            || typeof (input === null || input === void 0 ? void 0 : input.secret) !== 'string' || !/^[a-f\d]{48}$/i.test(input.secret))
            throw new AwbPrintError(400, 'Invalid print job confirmation');
        const task = yield Task_1.Task.findOne({ qrToken: token.toLowerCase(), isDeleted: { $ne: true } }).select('_id status').lean();
        if (!task)
            throw new AwbPrintError(404, 'Task not found');
        const job = yield AwbPrintJob_1.AwbPrintJob.findOne({ _id: id, taskId: String(task._id) }).select('+secretHash').lean();
        if (!job || !(0, crypto_1.timingSafeEqual)(Buffer.from((0, exports.hashPrintSecret)(input.secret)), Buffer.from(job.secretHash)))
            throw new AwbPrintError(404, 'Print job not found');
        const receipts = validatePrintReceipts(job.pages, input.receipts);
        if (job.state === 'confirmed')
            return { success: true, status: task.status, changed: false, alreadyConfirmed: true, taskId: String(task._id) };
        const alreadyApplied = yield Task_1.Task.findOne({ _id: task._id, awbPrintJobIds: id, isDeleted: { $ne: true } }).select('status').lean();
        if (alreadyApplied) {
            yield AwbPrintJob_1.AwbPrintJob.updateOne({ _id: id }, { $set: { state: 'confirmed', receipts, confirmedAt: new Date() } });
            return { success: true, status: alreadyApplied.status, changed: false, alreadyConfirmed: true, taskId: String(task._id) };
        }
        if (closed.includes(task.status))
            throw new AwbPrintError(409, 'Task changed after printing; it was not moved backwards to SHIPPED');
        const manifest = yield getManifest(token);
        if (!manifest)
            throw new AwbPrintError(404, 'Task not found');
        validatePrintPlan(manifest, job.labels);
        const now = new Date();
        // One atomic task update records the receipt and status transition together.
        // The job-id guard also handles a response lost after the update committed.
        const updated = yield Task_1.Task.findOneAndUpdate({
            _id: task._id, isDeleted: { $ne: true }, status: { $nin: closed }, awbPrintJobIds: { $ne: id },
        }, [{ $set: {
                    status: 'SHIPPED',
                    statusUpdatedAt: { $cond: [{ $eq: ['$status', 'SHIPPED'] }, '$statusUpdatedAt', now] },
                    awbPrintedAt: now,
                    awbPrintJobIds: { $concatArrays: [{ $ifNull: ['$awbPrintJobIds', []] }, [id]] },
                    statusHistory: { $concatArrays: [{ $ifNull: ['$statusHistory', []] }, { $cond: [
                                    { $eq: ['$status', 'SHIPPED'] }, [], [{
                                            fromStatus: '$status', toStatus: 'SHIPPED', fromIsDone: { $ifNull: ['$isDone', false] },
                                            toIsDone: { $ifNull: ['$isDone', false] }, changedAt: now,
                                        }],
                                ] }] },
                    activities: { $concatArrays: [{ $ifNull: ['$activities', []] }, [{
                                    userId: 'qr-awb-printer', userName: 'Production AWB Printer', action: 'AWB_PRINT_CONFIRMED',
                                    details: { $literal: `GP-1324D confirmed ${receipts.length} AWB page(s); task moved to SHIPPED. Job ${id}. Printer: ${job.printer}` }, createdAt: now,
                                }]] },
                } }], { new: true }).lean();
        if (!updated) {
            const done = yield Task_1.Task.findOne({ _id: task._id, awbPrintJobIds: id, isDeleted: { $ne: true } }).select('status').lean();
            if (!done)
                throw new AwbPrintError(409, 'Task changed. Printer completion saved locally; check this task');
        }
        yield AwbPrintJob_1.AwbPrintJob.updateOne({ _id: id }, { $set: { state: 'confirmed', receipts, confirmedAt: now } });
        return { success: true, status: (updated === null || updated === void 0 ? void 0 : updated.status) || 'SHIPPED', changed: !!updated, taskId: String(task._id) };
    });
}
