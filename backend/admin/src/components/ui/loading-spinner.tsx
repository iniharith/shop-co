/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Shared loading spinner used across every backend admin page.
 * A rotating conic-gradient arc (blue → purple/pink) with a soft tapering
 * tail, matching the reference animation. Pure CSS — no images, no JS
 * animation loop, so it's cheap to render everywhere.
 */
"use client";
import React from "react";

interface LoadingSpinnerProps {
  /** Pixel size of the spinner. Default 40. */
  size?: number;
  /** Extra classes on the wrapper */
  className?: string;
}

export function LoadingSpinner({ size = 40, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`kc-spinner ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <style jsx>{`
        .kc-spinner {
          border-radius: 9999px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 40deg,
            #6366f1 120deg,
            #a855f7 220deg,
            #ec4899 300deg,
            transparent 340deg
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3.5px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3.5px));
          animation: kc-spin 0.85s linear infinite;
        }
        @keyframes kc-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Full-section loader — use this as the `isPending` return value on any
 * page/manager component. Centers the spinner with a little breathing room
 * so it feels consistent whether it fills a page, a card, or a modal.
 */
export function PageLoader({
  label,
  className = "",
  minHeight = "50vh",
}: {
  label?: string;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 w-full ${className}`}
      style={{ minHeight }}
    >
      <LoadingSpinner size={44} />
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}

export default LoadingSpinner;
