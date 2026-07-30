/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Detects touch/tablet devices (iPad, Android tablets, phones) so heavy
 * decorative animations (loading spinners etc.) can be swapped for a
 * much lighter "lite" version on those devices.
 *
 * NOTE: this is intentionally separate from `use-mobile.tsx`. That hook
 * is a layout breakpoint (max-width: 767px) for responsive UI — it does
 * NOT catch iPads, which are commonly 768–1366px wide. This hook is
 * about device *capability* (touch/coarse-pointer), not screen size, so
 * it correctly includes iPads regardless of orientation or model.
 *
 * Why this exists: continuously-animated decorative effects (blur glows,
 * spinning rims, morphing shapes) that are cheap on desktop GPUs can
 * still add up on iPad, especially during a slow data load where the
 * animation runs for an extended period. Reducing to a single simple
 * pulse on these devices meaningfully cuts sustained GPU/compositor
 * work without changing the loading UX.
 */
import * as React from "react";

function detectTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Primary signal: the device's main input is touch (covers iPad even
  // in landscape/Pro sizes, and Android tablets/phones).
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;

  // iPadOS reports as "MacIntel" in Safari's desktop-class UA, but real
  // Macs never report multi-touch points — this catches that case even
  // if a future iPadOS build changes how pointer-media-queries resolve.
  const isIPadDesktopMode =
    typeof navigator !== "undefined" &&
    navigator.platform === "MacIntel" &&
    (navigator as any).maxTouchPoints > 1;

  return !!coarsePointer || isIPadDesktopMode;
}

export function useLowPowerAnimations(): boolean {
  const [lowPower, setLowPower] = React.useState(false);

  React.useEffect(() => {
    setLowPower(detectTouchDevice());

    const mql = window.matchMedia?.("(pointer: coarse)");
    if (!mql) return;
    const onChange = () => setLowPower(detectTouchDevice());
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return lowPower;
}
