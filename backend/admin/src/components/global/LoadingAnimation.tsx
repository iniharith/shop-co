/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Full-screen (or inline) loading animation — translucent glass sphere
 * with an iridescent Fresnel rim and a slowly swirling internal wave,
 * matching the reference: perfect circle (not a morphing blob),
 * blue/purple/teal/pink sheen, soft specular highlight.
 *
 * This is the ONE loading animation used across the entire admin app —
 * both the full-screen route-transition loader (app/loading.tsx) and
 * every inline "data is loading" state on every page.
 *
 * The full-screen variant keeps a solid black backdrop (boot/splash feel).
 * The inline variant (fullScreen={false}) uses your frosted glass card
 * style — bg-background/40, backdrop-blur, subtle border — so it blends
 * into the page instead of punching a black hole in it.
 *
 * Usage:
 *   <LoadingAnimation />                              // full-screen overlay, solid black
 *   <LoadingAnimation fullScreen={false} />            // inline, frosted glass card
 *   <LoadingAnimation label="Uploading artwork" />     // custom text
 *   <LoadingAnimation fullScreen={false} scale={0.5} /> // shrink for tight spaces (e.g. sidebars)
 *   <LoadingAnimation fullScreen={false} glass={false} /> // inline, transparent (no card bg at all)
 */
"use client";

interface LoadingAnimationProps {
  fullScreen?: boolean;
  label?: string;
  /** Shrinks the whole animation proportionally. 1 = default 200px stage. */
  scale?: number;
  /** Only applies when fullScreen is false. Default true — frosted glass card. */
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
        <div className="la-stage">
          <div className="la-ambient" />
          <div className="la-sphere">
            <div className="la-base" />
            <div className="la-swirl la-swirl--a" />
            <div className="la-swirl la-swirl--b" />
            <div className="la-shading" />
            <div className="la-rim" />
            <div className="la-specular" />
          </div>
        </div>

        {label && <p className="la-label">{label}</p>}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
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
        .la-stage {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .la-ambient {
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: radial-gradient(circle, #2f4fd6 0%, rgba(47, 79, 214, 0) 70%);
          filter: blur(28px);
          opacity: 0.5;
          animation: la-ambient-pulse 5s ease-in-out infinite;
        }

        .la-sphere {
          position: relative;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          overflow: hidden;
          isolation: isolate;
          box-shadow:
            0 0 30px 4px rgba(60, 100, 230, 0.45),
            0 0 60px 14px rgba(80, 60, 200, 0.25);
        }

        .la-base {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 42% 38%,
            #0c1230 0%,
            #060814 55%,
            #020308 100%
          );
        }

        /* the two swirling ribbon streaks that slowly rotate/drift */
        .la-swirl {
          position: absolute;
          width: 180%;
          height: 26%;
          left: -40%;
          mix-blend-mode: screen;
          filter: blur(10px);
          opacity: 0.5;
        }
        .la-swirl--a {
          top: 30%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            #3b6bff 22%,
            #7a5cff 38%,
            #33e0c0 52%,
            #ff6ec7 66%,
            transparent 100%
          );
          border-radius: 50%;
          transform: rotate(-18deg);
          animation: la-swirl-a 10s ease-in-out infinite;
        }
        .la-swirl--b {
          top: 54%;
          height: 20%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            #6a4bff 25%,
            #33e0c0 50%,
            #4f7bff 75%,
            transparent 100%
          );
          border-radius: 50%;
          opacity: 0.7;
          transform: rotate(14deg);
          animation: la-swirl-b 12s ease-in-out infinite;
        }

        /* spherical falloff — this is what actually sells the 3D ball shape */
        .la-shading {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 42% 38%,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0) 35%,
            rgba(0, 4, 20, 0.55) 72%,
            rgba(0, 2, 10, 0.9) 100%
          );
          mix-blend-mode: multiply;
        }

        /* Fresnel-style iridescent rim: conic gradient masked to a ring */
        .la-rim {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #4f7bff,
            #8a5cff,
            #33e0c0,
            #ff6ec7,
            #4f7bff
          );
          mix-blend-mode: screen;
          opacity: 0.7;
          -webkit-mask: radial-gradient(circle, transparent 66%, #000 72%, #000 90%, transparent 100%);
          mask: radial-gradient(circle, transparent 66%, #000 72%, #000 90%, transparent 100%);
          animation: la-rim-spin 8s linear infinite;
        }

        /* soft glassy specular highlight, upper-left */
        .la-specular {
          position: absolute;
          top: 8%;
          left: 12%;
          width: 30%;
          height: 18%;
          background: radial-gradient(ellipse, rgba(255, 255, 255, 0.75), transparent 70%);
          border-radius: 50%;
          filter: blur(1px);
          animation: la-specular-drift 6s ease-in-out infinite;
        }

        .la-label {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 15px;
          letter-spacing: 0.02em;
          color: #6b6f76;
        }

        @keyframes la-ambient-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes la-swirl-a {
          0% { transform: translate(-8%, -6%) rotate(-8deg); }
          50% { transform: translate(6%, 8%) rotate(6deg); }
          100% { transform: translate(-8%, -6%) rotate(-8deg); }
        }
        @keyframes la-swirl-b {
          0% { transform: translate(6%, 4%) rotate(5deg); }
          50% { transform: translate(-8%, -6%) rotate(-6deg); }
          100% { transform: translate(6%, 4%) rotate(5deg); }
        }
        @keyframes la-rim-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes la-specular-drift {
          0%, 100% { transform: translate(0, 0); opacity: 0.8; }
          50% { transform: translate(3%, 4%); opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          .la-ambient, .la-swirl, .la-rim, .la-specular {
            animation: none !important;
          }
        }
      `}} />
    </div>
  );
}
