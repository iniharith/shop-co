"use client";

import Lottie from "lottie-react";
import loadingAnimation from "../../../public/lottie/loading.json";

interface LoadingAnimationProps {
  fullScreen?: boolean;
  label?: string;
  scale?: number;
  glass?: boolean;
}

export default function LoadingAnimation({
  fullScreen = true,
  label = "Loading",
  scale = 1,
  glass = true,
}: LoadingAnimationProps) {
  const wrapClass = fullScreen
    ? "la-wrap la-wrap--full"
    : glass
    ? "la-wrap la-wrap--glass bg-background/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl"
    : "la-wrap";

  return (
    <div className={wrapClass}>
      <div className="la-scaler" style={{ transform: `scale(${scale})` }}>
        <div className="la-animation" role="status" aria-label={label || "Loading"}>
          <Lottie animationData={loadingAnimation} loop autoplay />
        </div>
        {label && <p className="la-label">{label}</p>}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .la-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow: hidden;
        }
        .la-wrap--full {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #000000;
        }
        .la-wrap--glass {
          padding: 40px;
        }
        .la-scaler {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }
        .la-animation {
          width: 336px;
          height: 189px;
        }
        .la-label {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 15px;
          letter-spacing: 0.02em;
          color: #6b6f76;
        }
        @media (prefers-reduced-motion: reduce) {
          .la-animation { opacity: 0.8; }
        }
      ` }} />
    </div>
  );
}
