/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Inline loading state — organic morphing blob with a glowing neon rim
 * that cycles through the full color spectrum. Used inline within page
 * content while data is fetching (as opposed to LoadingAnimation, which
 * is the full-screen route-transition loader in app/loading.tsx).
 *
 * Same visual language as LoadingAnimation, sized for inline use.
 */
import React from "react";

interface BouncySkeletonProps {
  text?: string;
}

export function BouncySkeleton({ text = "Loading..." }: BouncySkeletonProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-8 relative overflow-hidden">
      <div className="bsk-stage">
        <div className="bsk-flare bsk-flare--a" />
        <div className="bsk-flare bsk-flare--b" />
        <div className="bsk-glow" />
        <div className="bsk-blob" />
      </div>

      <h3 className="bsk-label">{text}</h3>

      <style dangerouslySetInnerHTML={{__html: `
        .bsk-stage {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .bsk-glow {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle, #33bfe0 0%, rgba(51,191,224,0) 70%);
          filter: blur(24px);
          opacity: 0.55;
          animation: bsk-hue 9s linear infinite, bsk-pulse 4.5s ease-in-out infinite;
        }
        .bsk-blob {
          position: relative;
          width: 96px;
          height: 96px;
          background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22), rgba(10,12,16,0.95) 62%);
          border: 1.5px solid #33bfe0;
          box-shadow:
            0 0 18px 3px #33bfe0,
            0 0 36px 8px rgba(51,191,224,0.35),
            inset 0 0 18px rgba(51,191,224,0.3);
          animation: bsk-morph 7s ease-in-out infinite, bsk-hue 9s linear infinite, bsk-rotate 14s linear infinite;
        }
        .bsk-flare {
          position: absolute;
          background: linear-gradient(90deg, transparent, #33bfe0, transparent);
          opacity: 0.35;
          animation: bsk-hue 9s linear infinite, bsk-flare-fade 4.5s ease-in-out infinite;
        }
        .bsk-flare--a { width: 190px; height: 1px; transform: rotate(45deg); }
        .bsk-flare--b { width: 190px; height: 1px; transform: rotate(-45deg); }
        .bsk-label {
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #6b6f76;
        }
        @keyframes bsk-hue { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }
        @keyframes bsk-morph {
          0% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
          25% { border-radius: 62% 38% 30% 70% / 55% 65% 35% 45%; }
          50% { border-radius: 50% 50% 72% 28% / 38% 62% 38% 62%; }
          75% { border-radius: 35% 65% 55% 45% / 65% 35% 65% 35%; }
          100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
        }
        @keyframes bsk-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bsk-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.65; }
        }
        @keyframes bsk-flare-fade {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bsk-glow, .bsk-blob, .bsk-flare { animation: none !important; }
          .bsk-blob { border-radius: 50%; }
        }
      `}} />
    </div>
  );
}
