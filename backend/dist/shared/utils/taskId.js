"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID_TASK_ID_MESSAGE = exports.isTaskId = void 0;
exports.validateTaskIdParam = validateTaskIdParam;
exports.uploadTaskId = uploadTaskId;
const isTaskId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
exports.isTaskId = isTaskId;
exports.INVALID_TASK_ID_MESSAGE = 'Task ID is missing or invalid. Reopen the task before saving or uploading.';
function validateTaskIdParam(_req, res, next, value) {
    if (!(0, exports.isTaskId)(value)) {
        res.status(400).json({ success: false, code: 'INVALID_TASK_ID', message: exports.INVALID_TASK_ID_MESSAGE });
        return;
    }
    next();
}
function uploadTaskId(taskId, folderPath) {
    const explicit = taskId !== undefined && taskId !== null && taskId !== '';
    const folder = typeof folderPath === 'string' && folderPath.startsWith('tasks/') ? folderPath.slice(6) : undefined;
    if ((explicit && !(0, exports.isTaskId)(taskId)) || (folder !== undefined && !(0, exports.isTaskId)(folder))
        || (explicit && folder !== undefined && String(taskId).toLowerCase() !== folder.toLowerCase()))
        throw new Error(exports.INVALID_TASK_ID_MESSAGE);
    return explicit ? taskId : folder;
}
