"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQrUrl = taskQrUrl;
// Task QR links must stay on the main site, including uploads handled by replicas.
function taskQrUrl(token) {
    return `https://admin.kampungcetak.com/task-access/${encodeURIComponent(token)}`;
}
