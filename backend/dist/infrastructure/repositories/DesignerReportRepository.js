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
exports.getDesignerReport = getDesignerReport;
const mongoose_1 = __importDefault(require("mongoose"));
const AuditLog_1 = require("../../domain/entities/AuditLog");
const Task_1 = require("../../domain/entities/Task");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const user_model_1 = __importDefault(require("../db/models/user.model"));
const designerReport_1 = require("../../shared/utils/designerReport");
function getDesignerReport(actorId, from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const window = (0, designerReport_1.designerReportWindow)(from, to);
        if (!/^[a-f\d]{24}$/i.test(actorId))
            throw new designerReport_1.DesignerReportError('Select a valid staff member.');
        const staff = yield user_model_1.default.findById(actorId).select('name role').lean();
        if (!staff || staff.role === 'client')
            throw new designerReport_1.DesignerReportError('Staff member not found.', 404);
        const records = yield AuditLog_1.AuditLog.aggregate([
            { $match: { actorId, action: 'file_add', createdAt: { $gte: window.start, $lt: window.endExclusive }, route: /^\/api\/tasks\/[a-f\d]{24}(?:\/|$)/i } },
            { $project: { date: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: window.timezone } }, taskId: { $arrayElemAt: [{ $split: ['$route', '/'] }, 3] } } },
            { $group: { _id: { date: '$date', taskId: { $toLower: '$taskId' } } } },
        ]).option({ maxTimeMS: 15000 });
        const ids = [...new Set(records.map(record => record._id.taskId))];
        const [tasks, drafts] = yield Promise.all([
            Task_1.Task.find({ _id: { $in: ids.map(id => new mongoose_1.default.Types.ObjectId(id)) } }).select('title category customerUsername').lean(),
            FileUpload_1.FileUpload.find({ taskId: { $in: ids }, tag: 'draft' }).select('taskId originalName').sort({ createdAt: 1, _id: 1 }).lean(),
        ]);
        const taskMap = new Map(tasks.map(task => [String(task._id), task]));
        const draftMap = new Map();
        for (const draft of drafts)
            if (draft.taskId && !draftMap.has(draft.taskId))
                draftMap.set(draft.taskId, draft.originalName);
        const days = window.dates.map(date => ({ date, tasks: records.filter(record => record._id.date === date).map(record => {
                const id = record._id.taskId;
                const task = taskMap.get(id);
                return { id, title: (task === null || task === void 0 ? void 0 : task.title) || `Task ${id}`, category: (task === null || task === void 0 ? void 0 : task.category) || 'Lain-lain', name: task ? (0, designerReport_1.designerTaskName)(task.title, draftMap.get(id), task.customerUsername) : `Task ${id}` };
            }).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)) }));
        return { staff: { id: actorId, name: staff.name }, from: window.from, to: window.to, timezone: window.timezone, generatedAt: new Date().toISOString(), uniqueTasks: ids.length, taskEntries: records.length, days };
    });
}
