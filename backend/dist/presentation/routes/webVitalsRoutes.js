"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const webVitals_model_1 = require("../../infrastructure/db/models/webVitals.model");
const router = (0, express_1.Router)();
const VALID_RATINGS = ["good", "needs-improvement", "poor"];
const MAX_SAMPLES_FOR_STATS = 50000;
// ─── POST /api/web-vitals ───────────────────────────────
// Report web-vital samples collected in the browser. Accepts a single sample
// or a batch: { metrics: [...] } or one metric object directly.
router.post("/", auth_middileware_1.default, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const raw = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.metrics) && Array.isArray(req.body.metrics)
        ? req.body.metrics
        : [req.body];
    const samples = raw
        .filter((s) => s && webVitals_model_1.WEB_VITALS_METRICS.includes(s.metric) && Number.isFinite(Number(s.value)))
        .slice(0, 50)
        .map((s) => ({
        userId: req.userId,
        path: String(s.path || "").slice(0, 500) || "/",
        route: String(s.route || "").slice(0, 200),
        metric: s.metric,
        value: Math.max(0, Number(s.value)),
        rating: VALID_RATINGS.includes(s.rating) ? s.rating : "good",
        device: s.device === "mobile" ? "mobile" : "desktop",
        connectionType: s.connectionType ? String(s.connectionType).slice(0, 50) : undefined,
        timestamp: new Date(),
    }));
    if (samples.length > 0) {
        yield webVitals_model_1.WebVitalsModel.insertMany(samples);
    }
    res.status(200).json({ success: true, accepted: samples.length });
})));
// ─── GET /api/web-vitals/stats ─────────────────────────
// Aggregate samples into a Vercel-style summary: per-metric percentiles +
// ratings, daily p75 trend, top routes, and device breakdown.
router.get("/stats", auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)("admin", "sysadmin", "boss"), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const daysParam = typeof req.query.days === "string" ? Number.parseInt(req.query.days, 10) : 30;
    const days = [7, 14, 30, 60, 90].includes(daysParam) ? daysParam : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const samples = yield webVitals_model_1.WebVitalsModel.find({ timestamp: { $gte: since } })
        .select("metric value rating route device timestamp -_id")
        .limit(MAX_SAMPLES_FOR_STATS)
        .lean();
    const percentile = (values, p) => {
        if (values.length === 0)
            return null;
        const sorted = [...values].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
        return Math.round(sorted[idx] * 100) / 100;
    };
    const byMetric = new Map();
    for (const s of samples) {
        let bucket = byMetric.get(s.metric);
        if (!bucket) {
            bucket = { values: [], ratings: { good: 0, "needs-improvement": 0, poor: 0 }, count: 0 };
            byMetric.set(s.metric, bucket);
        }
        bucket.values.push(s.value);
        bucket.ratings[s.rating] += 1;
        bucket.count += 1;
    }
    const summary = webVitals_model_1.WEB_VITALS_METRICS.map((metric) => {
        const bucket = byMetric.get(metric);
        if (!bucket || bucket.count === 0) {
            return { metric, count: 0, p50: null, p75: null, p90: null, good: 0, needsImprovement: 0, poor: 0, goodRate: null };
        }
        const total = bucket.count;
        return {
            metric,
            count: bucket.count,
            p50: percentile(bucket.values, 50),
            p75: percentile(bucket.values, 75),
            p90: percentile(bucket.values, 90),
            good: bucket.ratings.good,
            needsImprovement: bucket.ratings["needs-improvement"],
            poor: bucket.ratings.poor,
            goodRate: Math.round((bucket.ratings.good / total) * 1000) / 10,
        };
    });
    // Daily p75 trend per metric.
    const dayKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const trendMap = new Map();
    for (const s of samples) {
        const key = dayKey(s.timestamp);
        let dayBucket = trendMap.get(key);
        if (!dayBucket) {
            dayBucket = new Map();
            trendMap.set(key, dayBucket);
        }
        for (const m of [s.metric]) {
            let vals = dayBucket.get(m);
            if (!vals) {
                vals = [];
                dayBucket.set(m, vals);
            }
            vals.push(s.value);
        }
    }
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = dayKey(d);
        const row = { date: key };
        for (const metric of webVitals_model_1.WEB_VITALS_METRICS) {
            const vals = ((_a = trendMap.get(key)) === null || _a === void 0 ? void 0 : _a.get(metric)) || [];
            row[metric] = percentile(vals, 75);
        }
        trend.push(row);
    }
    // Top routes by sample volume.
    const routeMap = new Map();
    for (const s of samples) {
        const route = s.route || s.path || "/";
        let entry = routeMap.get(route);
        if (!entry) {
            entry = { route, count: 0, values: [] };
            routeMap.set(route, entry);
        }
        entry.count += 1;
        entry.values.push(s.value);
    }
    const topRoutes = [...routeMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map(({ route, count, values }) => ({
        route: route.length > 80 ? `${route.slice(0, 80)}...` : route,
        count,
        p75: percentile(values, 75),
    }));
    // Device breakdown.
    const devices = { mobile: 0, desktop: 0 };
    for (const s of samples) {
        devices[s.device === "mobile" ? "mobile" : "desktop"] += 1;
    }
    res.status(200).json({
        success: true,
        data: {
            range: {
                days,
                from: since.toISOString(),
                timezone: "UTC",
            },
            totalSamples: samples.length,
            summary,
            trend,
            topRoutes,
            devices,
        },
    });
})));
exports.default = router;
