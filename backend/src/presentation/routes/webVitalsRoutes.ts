/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import authMiddilware, { authorizeRoles } from "../middlewares/auth.middileware";
import { AuthRequest } from "../../domain/types/api";
import {
  WebVitalsModel,
  WEB_VITALS_METRICS,
  WebVitalsMetricName,
} from "../../infrastructure/db/models/webVitals.model";

const router = Router();

const VALID_RATINGS = ["good", "needs-improvement", "poor"];
const MAX_SAMPLES_FOR_STATS = 50_000;

// ─── POST /api/web-vitals ───────────────────────────────
// Report web-vital samples collected in the browser. Accepts a single sample
// or a batch: { metrics: [...] } or one metric object directly.
router.post(
  "/",
  authMiddilware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const raw = req.body?.metrics && Array.isArray(req.body.metrics)
      ? req.body.metrics
      : [req.body];

    const samples = (raw as any[])
      .filter((s: any) => s && WEB_VITALS_METRICS.includes(s.metric) && Number.isFinite(Number(s.value)))
      .slice(0, 50)
      .map((s: any) => ({
        userId: req.userId,
        path: String(s.path || "").slice(0, 500) || "/",
        route: String(s.route || "").slice(0, 200),
        metric: s.metric as WebVitalsMetricName,
        value: Math.max(0, Number(s.value)),
        rating: VALID_RATINGS.includes(s.rating) ? s.rating : "good",
        device: s.device === "mobile" ? "mobile" : "desktop",
        connectionType: s.connectionType ? String(s.connectionType).slice(0, 50) : undefined,
        timestamp: new Date(),
      }));

    if (samples.length > 0) {
      await WebVitalsModel.insertMany(samples);
    }

    res.status(200).json({ success: true, accepted: samples.length });
  })
);

// ─── GET /api/web-vitals/stats ─────────────────────────
// Aggregate samples into a Vercel-style summary: per-metric percentiles +
// ratings, daily p75 trend, top routes, and device breakdown.
router.get(
  "/stats",
  authMiddilware,
  authorizeRoles("admin", "sysadmin", "boss"),
  asyncHandler(async (req: Request, res: Response) => {
    const daysParam = typeof req.query.days === "string" ? Number.parseInt(req.query.days, 10) : 30;
    const days = [7, 14, 30, 60, 90].includes(daysParam) ? daysParam : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const samples = await WebVitalsModel.find({ timestamp: { $gte: since } })
      .select("metric value rating route device timestamp -_id")
      .limit(MAX_SAMPLES_FOR_STATS)
      .lean();

    const percentile = (values: number[], p: number) => {
      if (values.length === 0) return null;
      const sorted = [...values].sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
      return Math.round(sorted[idx] * 100) / 100;
    };

    const byMetric = new Map<string, { values: number[]; ratings: Record<string, number>; count: number }>();
    for (const s of samples) {
      let bucket = byMetric.get(s.metric);
      if (!bucket) {
        bucket = { values: [], ratings: { good: 0, "needs-improvement": 0, poor: 0 }, count: 0 };
        byMetric.set(s.metric, bucket);
      }
      bucket.values.push(s.value);
      bucket.ratings[s.rating as "good"] += 1;
      bucket.count += 1;
    }

    const summary = WEB_VITALS_METRICS.map((metric) => {
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
    const dayKey = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const trendMap = new Map<string, Map<string, number[]>>();
    for (const s of samples) {
      const key = dayKey(s.timestamp);
      let dayBucket = trendMap.get(key);
      if (!dayBucket) {
        dayBucket = new Map<string, number[]>();
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

    const trend: { date: string; [metric: string]: string | number | null }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = dayKey(d);
      const row: { date: string; [metric: string]: string | number | null } = { date: key };
      for (const metric of WEB_VITALS_METRICS) {
        const vals = trendMap.get(key)?.get(metric) || [];
        row[metric] = percentile(vals, 75);
      }
      trend.push(row);
    }

    // Top routes by sample volume.
    const routeMap = new Map<string, { route: string; count: number; values: number[] }>();
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
  })
);

export default router;
