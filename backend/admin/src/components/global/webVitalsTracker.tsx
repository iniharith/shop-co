/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { MetricType } from "web-vitals";
import AxiosInstance from "@/utils/axios";

const VALID_METRICS = ["cls", "fcp", "inp", "lcp", "ttfb"];

/**
 * Self-hosted web-vitals collector. Replaces the need to rely on the Vercel
 * dashboard for speed data: every reported Core Web Vital is batched and
 * POSTed to the backend (/api/web-vitals), where it can be visualised in the
 * Monitoring page.
 */
export function WebVitalsTracker() {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = session?.user?.token || localStorage.getItem("token") || "";
    if (!token) return;

    let queue: unknown[] = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flush = async () => {
      if (queue.length === 0) return;
      const batch = queue;
      queue = [];
      try {
        await AxiosInstance(token).post("/api/web-vitals", { metrics: batch });
      } catch {
        // Never block the app on telemetry failures.
      }
    };

    const queueMetric = (metric: MetricType) => {
      const name = (metric.name || "").toLowerCase();
      if (!VALID_METRICS.includes(name)) return;
      queue.push({
        path: window.location.pathname,
        route: window.location.pathname,
        metric: name,
        value: metric.value,
        rating: metric.rating || "good",
        device: navigator.maxTouchPoints > 0 ? "mobile" : "desktop",
        connectionType: (navigator as any).connection?.effectiveType || undefined,
      });
      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushTimer = null;
          flush();
        }, 5000);
      }
    };

    onCLS(queueMetric);
    onFCP(queueMetric);
    onINP(queueMetric);
    onLCP(queueMetric);
    onTTFB(queueMetric);

    const onUnload = () => flush();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      if (flushTimer) clearTimeout(flushTimer);
      flush();
    };
  }, [session?.user?.token]);

  return null;
}
