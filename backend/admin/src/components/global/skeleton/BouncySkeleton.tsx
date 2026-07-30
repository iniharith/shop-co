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
 *
 * ---------------------------------------------------------------------
 * iOS/iPadOS Safari crash fix (July 2026), part 1: animated filter:blur()
 * / hue-rotate() replaced with pre-blurred gradients + static rotating
 * conic-gradient ring — see previous patch notes.
 *
 * iPad/mobile "lite mode" (part 2): on touch devices, skip the ring,
 * blob-morph, and flares entirely and render one simple pulsing circle
 * — same reasoning as LoadingAnimation's lite mode.
 */
import React from "react";
import { useLowPowerAnimations } from "@/hooks/useLowPowerAnimations";

interface BouncySkeletonProps {
  text?: string;
}

export function BouncySkeleton({ text = "Loading..." }: BouncySkeletonProps) {
  const lowPower = useLowPowerAnimations();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-8 relative overflow-hidden">
      {lowPower ? (
        <div className="bsk-stage bsk-stage--lite">
          <div className="bsk-lite-pulse" />
        </div>
      ) : (
        <div className="bsk-stage">
          <div className="bsk-flare bsk-flare--a" />
          <div className="bsk-flare bsk-flare--b" />
          <div className="bsk-glow" />
          <div className="bsk-ring" />
          <div className="bsk-blob" />
        </div>
      )}

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
          contain: layout paint style;
        }

        /* ---------- LITE MODE (iPad / touch devices) ---------- */
        .bsk-stage--lite {
          width: 90px;
          height: 90px;
        }
        .bsk-lite-pulse {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.3), #33bfe0 75%);
          box-shadow: 0 0 20px 4px rgba(51,191,224,0.4);
          animation: bsk-lite-pulse 1.4s ease-in-out infinite;
        }
        @keyframes bsk-lite-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.55; }
          50% { transform: scale(1); opacity: 1; }
        }

        /* ---------- FULL MODE (desktop) ---------- */
        .bsk-glow {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(51, 191, 224, 0.5) 0%,
            rgba(51, 191, 224, 0.28) 35%,
            rgba(51, 191, 224, 0.1) 60%,
            rgba(51, 191, 224, 0) 75%
          );
          opacity: 0.55;
          animation: bsk-pulse 4.5s ease-in-out infinite;
          will-change: transform;
        }

        .bsk-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #33bfe0, #33e0a8, #bfe033, #e0a833, #e03370, #a833e0, #3346e0, #33bfe0
          );
          opacity: 0.5;
          -webkit-mask: radial-gradient(circle, transparent 62%, #000 68%, #000 92%, transparent 100%);
          mask: radial-gradient(circle, transparent 62%, #000 68%, #000 92%, transparent 100%);
          animation: bsk-rotate 9s linear infinite;
          will-change: transform;
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
          animation: bsk-morph 7s ease-in-out infinite;
          will-change: border-radius;
        }
        .bsk-flare {
          position: absolute;
          background: linear-gradient(90deg, transparent, #33bfe0, transparent);
          opacity: 0.35;
          animation: bsk-flare-fade 4.5s ease-in-out infinite;
        }
        .bsk-flare--a { width: 190px; height: 1px; transform: rotate(45deg); }
        .bsk-flare--b { width: 190px; height: 1px; transform: rotate(-45deg); }
        .bsk-label {
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #6b6f76;
        }
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
          .bsk-glow, .bsk-ring, .bsk-blob, .bsk-flare, .bsk-lite-pulse { animation: none !important; }
          .bsk-blob { border-radius: 50%; }
        }
      `}} />
    </div>
  );
}
