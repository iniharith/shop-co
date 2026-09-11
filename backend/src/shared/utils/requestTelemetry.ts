import { NextFunction, Request, Response } from 'express';
import os from 'os';
import { monitorEventLoopDelay } from 'perf_hooks';

export interface RequestTrace {
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export class RingBuffer<T> {
  private readonly items: T[] = [];

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity must be a positive integer');
  }

  push(value: T): void {
    if (this.items.length === this.capacity) this.items.shift();
    this.items.push(value);
  }

  values(): T[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }
}

export const percentile = (values: number[], quantile: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(Math.min(1, Math.max(0, quantile)) * sorted.length) - 1);
  return sorted[index];
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const pathOnly = (url: string): string => (url.split(/[?#]/, 1)[0] || '/');

export const routeTemplate = (originalUrl: string, matchedPath?: unknown): string => {
  if (Array.isArray(matchedPath)) {
    const pathname = pathOnly(originalUrl);
    matchedPath = matchedPath.find(path => typeof path === 'string' && path === pathname) || matchedPath[0];
  }
  if (typeof matchedPath !== 'string' || !matchedPath.startsWith('/')) return '/unmatched';
  const routeSegments = matchedPath.split('/').filter(Boolean);
  const originalSegments = pathOnly(originalUrl).split('/').filter(Boolean);
  if (routeSegments.length > originalSegments.length) return matchedPath;
  const mountSegments = originalSegments.slice(0, originalSegments.length - routeSegments.length);
  // Mount paths are application-owned static prefixes. Dynamic route values come only from matchedPath templates.
  return `/${[...mountSegments, ...routeSegments].join('/')}`.replace(/\/+/g, '/');
};

export const summarizeTraces = (traces: RequestTrace[], nowMs: number, windowMs = 5 * 60_000) => {
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
    requestsPerMinute: round(recent.length / (windowMs / 60_000)),
    serverErrors,
    errorRatePercent: recent.length ? round((serverErrors / recent.length) * 100) : 0,
    latencyMs: {
      p50: round(percentile(durations, 0.5)),
      p95: round(percentile(durations, 0.95)),
    },
  };
};

const traces = new RingBuffer<RequestTrace>(1000);
const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

let previousCpu = process.cpuUsage();
let previousCpuAt = process.hrtime.bigint();

export const requestTelemetryMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = new Date();
  const started = process.hrtime.bigint();

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    traces.push({
      requestId: (req as Request & { requestId?: string }).requestId || 'unknown',
      method: req.method.toUpperCase(),
      route: routeTemplate(req.originalUrl || req.url, req.route?.path),
      status: res.statusCode,
      durationMs: round(durationMs),
      timestamp: startedAt.toISOString(),
    });
  });
  next();
};

export const getOperationalTelemetry = () => {
  const now = Date.now();
  const currentCpu = process.cpuUsage();
  const currentCpuAt = process.hrtime.bigint();
  const elapsedMicros = Number(currentCpuAt - previousCpuAt) / 1000;
  const usedMicros = (currentCpu.user - previousCpu.user) + (currentCpu.system - previousCpu.system);
  const cpuPercent = elapsedMicros > 0
    ? (usedMicros / elapsedMicros / Math.max(os.cpus().length, 1)) * 100
    : 0;
  previousCpu = currentCpu;
  previousCpuAt = currentCpuAt;

  const memory = process.memoryUsage();
  const lagMean = Number.isFinite(eventLoopDelay.mean) ? eventLoopDelay.mean / 1_000_000 : 0;
  const lagP95 = eventLoopDelay.percentile(95) / 1_000_000;
  eventLoopDelay.reset();
  const values = traces.values();

  return {
    requests: summarizeTraces(values, now),
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
