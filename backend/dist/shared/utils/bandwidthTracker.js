"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bandwidthMiddleware = exports.bandwidthHistory = void 0;
exports.bandwidthHistory = [];
let currentBytesIn = 0;
let currentBytesOut = 0;
// Update bandwidth history every 5 seconds
setInterval(() => {
    exports.bandwidthHistory.push({
        timestamp: new Date().toISOString(),
        bytesIn: currentBytesIn,
        bytesOut: currentBytesOut,
    });
    // Keep last 60 entries (5 minutes of data)
    if (exports.bandwidthHistory.length > 60) {
        exports.bandwidthHistory.shift();
    }
    currentBytesIn = 0;
    currentBytesOut = 0;
}, 5000);
const bandwidthMiddleware = (req, res, next) => {
    // Track incoming based on content-length (faster and doesn't interfere with streams)
    const incomingLength = parseInt(req.headers['content-length'] || '0', 10);
    if (!isNaN(incomingLength)) {
        currentBytesIn += incomingLength;
    }
    // Track outgoing by hooking into write and end
    const originalWrite = res.write;
    const originalEnd = res.end;
    res.write = function (chunk, ...args) {
        if (chunk) {
            currentBytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.from(String(chunk)).length;
        }
        return originalWrite.apply(res, [chunk, ...args]);
    };
    res.end = function (chunk, ...args) {
        if (chunk && typeof chunk !== 'function') {
            currentBytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.from(String(chunk)).length;
        }
        return originalEnd.apply(res, [chunk, ...args]);
    };
    next();
};
exports.bandwidthMiddleware = bandwidthMiddleware;
