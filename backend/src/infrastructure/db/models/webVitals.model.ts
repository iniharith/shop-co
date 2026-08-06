/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from "mongoose";

export const WEB_VITALS_METRICS = ["lcp", "cls", "inp", "fcp", "ttfb", "fid"] as const;
export type WebVitalsMetricName = (typeof WEB_VITALS_METRICS)[number];

export interface IWebVitals {
  userId?: string;
  path: string;
  route: string;
  metric: WebVitalsMetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  device: "mobile" | "desktop";
  connectionType?: string;
  timestamp: Date;
}

export interface IWebVitalsDocument extends IWebVitals, Document {}

const WebVitalsSchema = new Schema<IWebVitalsDocument>(
  {
    userId: {
      type: String,
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      default: "",
    },
    metric: {
      type: String,
      required: true,
      enum: WEB_VITALS_METRICS,
    },
    value: {
      type: Number,
      required: true,
    },
    rating: {
      type: String,
      required: true,
      enum: ["good", "needs-improvement", "poor"],
    },
    device: {
      type: String,
      default: "desktop",
      enum: ["mobile", "desktop"],
    },
    connectionType: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

WebVitalsSchema.index({ metric: 1, timestamp: -1 });
WebVitalsSchema.index({ route: 1, metric: 1 });
WebVitalsSchema.index({ timestamp: -1 });

export const WebVitalsModel = mongoose.model<IWebVitalsDocument>(
  "WebVitals",
  WebVitalsSchema
);
