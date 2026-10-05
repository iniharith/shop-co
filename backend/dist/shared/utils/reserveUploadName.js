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
exports.reserveUploadName = reserveUploadName;
const Project_1 = require("../../domain/entities/Project");
const FileUpload_1 = require("../../domain/entities/FileUpload");
const Task_1 = require("../../domain/entities/Task");
const UploadNameReservation_1 = require("../../domain/entities/UploadNameReservation");
const duplicateFileName_1 = require("./duplicateFileName");
// Reserve at URL creation so concurrent uploads cannot choose the same name.
function reserveUploadName(req, res, scope) {
    return __awaiter(this, void 0, void 0, function* () {
        const requested = req.body.filename;
        if (typeof requested !== 'string' || !requested.trim() || requested.length > 255) {
            res.status(400).json({ success: false, message: 'Invalid filename' });
            return null;
        }
        const filter = scope.taskId ? { taskId: scope.taskId } : scope.orderId ? { orderId: scope.orderId } : { userId: scope.userId };
        const scopeKey = JSON.stringify(scope.projectId ? { projectId: scope.projectId } : filter);
        yield UploadNameReservation_1.UploadNameReservation.init();
        const records = scope.projectId ? [] : yield FileUpload_1.FileUpload.find(filter).select('originalName').lean();
        const names = records.map(file => file.originalName);
        if (scope.projectId) {
            const project = yield Project_1.Project.findById(scope.projectId).select('files.originalName').lean();
            names.push(...((project === null || project === void 0 ? void 0 : project.files) || []).map(file => file.originalName));
        }
        if (scope.taskId) {
            const task = yield Task_1.Task.findById(scope.taskId).select('files.name').lean();
            names.push(...((task === null || task === void 0 ? void 0 : task.files) || []).map(file => file.name));
        }
        yield UploadNameReservation_1.UploadNameReservation.deleteMany({ scope: scopeKey, expiresAt: { $lte: new Date() } });
        const reservations = yield UploadNameReservation_1.UploadNameReservation.find({ scope: scopeKey }).lean();
        names.push(...reservations.map(item => item.name));
        for (let attempt = 0; attempt < 100; attempt++) {
            const assignedName = (0, duplicateFileName_1.nextFileName)(requested, names);
            if (assignedName !== requested && req.body.duplicateAction !== 'rename') {
                res.json({ success: false, code: 'DUPLICATE_FILE', message: 'Duplicated file', originalName: requested, suggestedName: assignedName });
                return null;
            }
            try {
                yield UploadNameReservation_1.UploadNameReservation.create({ scope: scopeKey, name: assignedName.toLowerCase(), expiresAt: new Date(Date.now() + 3600000) });
                return assignedName;
            }
            catch (error) {
                if (error.code !== 11000)
                    throw error;
                names.push(assignedName);
            }
        }
        throw new Error('Unable to reserve upload filename. Please retry.');
    });
}
