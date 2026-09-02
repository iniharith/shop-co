/**
 * Coded by Harith
 * Kampungcetak ®
 * Orbea-style video hero banner with high-impact typography
 */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "nextjs-toploader/app";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Volume2, VolumeX, Play, Pause, ChevronDown } from "lucide-react";

const Hero = () => {
  const router = useRouter();
  const { locale } = useLanguage();
  const label = (en: string, ms: string) => (locale === "ms" ? ms : en);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleScrollDown = () => {
    const target = document.getElementById("featured-section") || document.querySelector("main");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
    }
  };

  return (
    <section className="hero-full-bleed relative w-full h-screen min-h-[640px] flex items-end justify-start overflow-hidden bg-black select-none">
      {/* ── Background Video (Rock-solid, no scale/transform jitter) ── */}
      <video
        ref={videoRef}
        src="/hero-video.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* ── Cinematic Orbea Vignette & Gradient Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* ── Main Banner Content: Bottom-Left Aligned (Exact Orbea Screenshot Layout) ── */}
      <div className="relative z-20 flex flex-col items-start text-left px-6 sm:px-10 md:px-16 lg:px-20 pb-16 sm:pb-20 md:pb-24 w-full max-w-4xl">
        {/* Main Headline - Stacked Bold (Matches "The Yes Machine") */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-[-0.03em] leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
        >
          {label("The Precision", "Cetakan")}
          <br />
          {label("Printing", "Berkualiti")}
        </motion.h1>

        {/* Sub-headline Narrative */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-neutral-200/90 max-w-xl font-normal leading-relaxed mt-4 md:mt-5 drop-shadow-sm"
        >
          {label(
            "Unlock your brand's potential. Direct factory printing, bespoke packaging & signs with 48-hour delivery across Malaysia.",
            "Buka potensi jenama anda. Percetakan kilang terus, pembungkusan khas & papan tanda dengan penghantaran 48 jam ke seluruh Malaysia."
          )}
        </motion.p>

        {/* Orbea Pill CTA Action Buttons (Matches "Discover Wild LT" & "Customise yours") */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-row flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 items-center"
        >
          <button
            onClick={() => router.push("/home/shop")}
            className="inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 bg-[#f4b400] text-[#171717] font-semibold text-xs sm:text-sm tracking-normal rounded-full hover:bg-[#ffc52e] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {label("Discover Products", "Beli Sekarang")}
          </button>
          <button
            onClick={() => router.push("/home/shop")}
            className="inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 bg-black/40 backdrop-blur-md border border-white/30 text-white font-semibold text-xs sm:text-sm tracking-normal rounded-full hover:bg-white/20 hover:border-white/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {label("Customise yours", "Tempahan khas")}
          </button>
        </motion.div>
      </div>

      {/* ── Video Controls (Mute / Play Toggle) ── */}
      <div className="absolute bottom-8 right-6 sm:right-10 z-30 hidden sm:flex items-center gap-2">
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all duration-200 cursor-pointer"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all duration-200 cursor-pointer"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
      </div>

      {/* ── Animated Scroll Indicator ── */}
      <button
        onClick={handleScrollDown}
        aria-label="Scroll to discover content"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <ChevronDown size={20} className="animate-bounce opacity-70" />
      </button>
    </section>
  );
};

export default Hero;
