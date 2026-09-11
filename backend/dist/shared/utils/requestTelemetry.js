"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationalTelemetry = exports.requestTelemetryMiddleware = exports.summarizeTraces = exports.routeTemplate = exports.percentile = exports.RingBuffer = void 0;
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
class RingBuffer {
    constructor(capacity) {
        this.capacity = capacity;
        this.items = [];
        if (!Number.isInteger(capacity) || capacity < 1)
            throw new Error('capacity must be a positive integer');
    }
    push(value) {
        if (this.items.length === this.capacity)
            this.items.shift();
        this.items.push(value);
    }
    values() {
        return [...this.items];
    }
    get size() {
        return this.items.length;
    }
}
exports.RingBuffer = RingBuffer;
const percentile = (values, quantile) => {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.max(0, Math.ceil(Math.min(1, Math.max(0, quantile)) * sorted.length) - 1);
    return sorted[index];
};
exports.percentile = percentile;
const round = (value, digits = 2) => {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
};
const pathOnly = (url) => (url.split(/[?#]/, 1)[0] || '/');
const routeTemplate = (originalUrl, matchedPath) => {
    if (Array.isArray(matchedPath)) {
        const pathname = pathOnly(originalUrl);
        matchedPath = matchedPath.find(path => typeof path === 'string' && path === pathname) || matchedPath[0];
    }
    if (typeof matchedPath !== 'string' || !matchedPath.startsWith('/'))
        return '/unmatched';
    const routeSegments = matchedPath.split('/').filter(Boolean);
    const originalSegments = pathOnly(originalUrl).split('/').filter(Boolean);
    if (routeSegments.length > originalSegments.length)
        return matchedPath;
    const mountSegments = originalSegments.slice(0, originalSegments.length - routeSegments.length);
    // Mount paths are application-owned static prefixes. Dynamic route values come only from matchedPath templates.
    return `/${[...mountSegments, ...routeSegments].join('/')}`.replace(/\/+/g, '/');
};
exports.routeTemplate = routeTemplate;
const summarizeTraces = (traces, nowMs, windowMs = 5 * 60000) => {
    const fromMs = nowMs - windowMs;
    const recent = traces.filter(trace => {
        const timestamp = Date.parse(trace.timestamp);
        return Number.isFinite(timestamp) && timestamp >= fromMs && timestamp <= nowMs;
    });
    const durations = recent.map(trace => trace.durationMs);
    const serverErrors = recent.filter(trace => trace.status >= 500).length;
    return {
        observedAt: new Date(nowMs).toISOString(),
        windowSeconds: Math.round(windowMs / 1000),
        requests: recent.length,
        requestsPerMinute: round(recent.length / (windowMs / 60000)),
        serverErrors,
        errorRatePercent: recent.length ? round((serverErrors / recent.length) * 100) : 0,
        latencyMs: {
            p50: round((0, exports.percentile)(durations, 0.5)),
            p95: round((0, exports.percentile)(durations, 0.95)),
        },
    };
};
exports.summarizeTraces = summarizeTraces;
const traces = new RingBuffer(1000);
const eventLoopDelay = (0, perf_hooks_1.monitorEventLoopDelay)({ resolution: 20 });
eventLoopDelay.enable();
let previousCpu = process.cpuUsage();
let previousCpuAt = process.hrtime.bigint();
const requestTelemetryMiddleware = (req, res, next) => {
    const startedAt = new Date();
    const started = process.hrtime.bigint();
    res.once('finish', () => {
        var _a;
        const durationMs = Number(process.hrtime.bigint() - started) / 1000000;
        traces.push({
            requestId: req.requestId || 'unknown',
            method: req.method.toUpperCase(),
            route: (0, exports.routeTemplate)(req.originalUrl || req.url, (_a = req.route) === null || _a === void 0 ? void 0 : _a.path),
            status: res.statusCode,
            durationMs: round(durationMs),
            timestamp: startedAt.toISOString(),
        });
    });
    next();
};
exports.requestTelemetryMiddleware = requestTelemetryMiddleware;
const getOperationalTelemetry = () => {
    const now = Date.now();
    const currentCpu = process.cpuUsage();
    const currentCpuAt = process.hrtime.bigint();
    const elapsedMicros = Number(currentCpuAt - previousCpuAt) / 1000;
    const usedMicros = (currentCpu.user - previousCpu.user) + (currentCpu.system - previousCpu.system);
    const cpuPercent = elapsedMicros > 0
        ? (usedMicros / elapsedMicros / Math.max(os_1.default.cpus().length, 1)) * 100
        : 0;
    previousCpu = currentCpu;
    previousCpuAt = currentCpuAt;
    const memory = process.memoryUsage();
    const lagMean = Number.isFinite(eventLoopDelay.mean) ? eventLoopDelay.mean / 1000000 : 0;
    const lagP95 = eventLoopDelay.percentile(95) / 1000000;
    eventLoopDelay.reset();
    const values = traces.values();
    return {
        requests: (0, exports.summarizeTraces)(values, now),
        process: {
            observedAt: new Date(now).toISOString(),
            uptimeSeconds: round(process.uptime()),
            cpuPercent: round(cpuPercent),
            memoryBytes: {
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                rss: memory.rss,
            },
            eventLoopLagMs: {
                mean: round(lagMean),
                p95: round(Number.isFinite(lagP95) ? lagP95 : 0),
            },
        },
        recentTraces: values.slice(-100).reverse(),
        traceCapacity: 1000,
    };
};
exports.getOperationalTelemetry = getOperationalTelemetry;
