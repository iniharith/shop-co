/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Full-screen (or inline) loading animation — organic morphing blob
 * with a glowing neon rim that continuously cycles through the color
 * spectrum, matching the reference: black background, soft ambient
 * glow, faint light-flare streaks, "Loading..." label below.
 *
 * Usage:
 *   <LoadingAnimation />                          // full-screen overlay
 *   <LoadingAnimation fullScreen={false} />        // inline, sized to parent
 *   <LoadingAnimation label="Uploading artwork" /> // custom text
 */
"use client";

interface LoadingAnimationProps {
  fullScreen?: boolean;
  label?: string;
}

export default function LoadingAnimation({
  fullScreen = true,
  label = "Loading",
}: LoadingAnimationProps) {
  return (
    <div className={fullScreen ? "la-wrap la-wrap--full" : "la-wrap"}>
      <div className="la-stage">
        <div className="la-flare la-flare--a" />
        <div className="la-flare la-flare--b" />
        <div className="la-glow" />
        <div className="la-blob" />
      </div>

      <p className="la-label">{label}</p>

      <style jsx>{`
        .la-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          background: #000000;
          padding: 48px;
          overflow: hidden;
        }
        .la-wrap--full {
          position: fixed;
          inset: 0;
          z-index: 9999;
        }
        .la-stage {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .la-glow {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, #33bfe0 0%, rgba(51, 191, 224, 0) 70%);
          filter: blur(30px);
          opacity: 0.55;
          animation: la-hue 9s linear infinite, la-pulse 4.5s ease-in-out infinite;
        }

        .la-blob {
          position: relative;
          width: 130px;
          height: 130px;
          background: radial-gradient(
            circle at 32% 28%,
            rgba(255, 255, 255, 0.22),
            rgba(10, 12, 16, 0.95) 62%
          );
          border: 1.5px solid #33bfe0;
          box-shadow:
            0 0 22px 3px #33bfe0,
            0 0 46px 10px rgba(51, 191, 224, 0.35),
            inset 0 0 24px rgba(51, 191, 224, 0.3);
          animation: la-morph 7s ease-in-out infinite, la-hue 9s linear infinite,
            la-rotate 14s linear infinite;
        }

        .la-flare {
          position: absolute;
          background: linear-gradient(90deg, transparent, #33bfe0, transparent);
          opacity: 0.35;
          animation: la-hue 9s linear infinite, la-flare-fade 4.5s ease-in-out infinite;
        }
        .la-flare--a {
          width: 260px;
          height: 1px;
          transform: rotate(45deg);
        }
        .la-flare--b {
          width: 260px;
          height: 1px;
          transform: rotate(-45deg);
        }

        .la-label {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 15px;
          letter-spacing: 0.02em;
          color: #6b6f76;
        }

        @keyframes la-hue {
          from {
            filter: hue-rotate(0deg);
          }
          to {
            filter: hue-rotate(360deg);
          }
        }
        @keyframes la-morph {
          0% {
            border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
          }
          25% {
            border-radius: 62% 38% 30% 70% / 55% 65% 35% 45%;
          }
          50% {
            border-radius: 50% 50% 72% 28% / 38% 62% 38% 62%;
          }
          75% {
            border-radius: 35% 65% 55% 45% / 65% 35% 65% 35%;
          }
          100% {
            border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
          }
        }
        @keyframes la-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes la-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.65;
          }
        }
        @keyframes la-flare-fade {
          0%,
          100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .la-glow,
          .la-blob,
          .la-flare {
            animation: none !important;
          }
          .la-blob {
            border-radius: 50%;
          }
        }
      `}</style>
    </div>
  );
}
