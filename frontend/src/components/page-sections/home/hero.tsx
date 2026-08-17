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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;

      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoaded(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      };

      attemptPlay();

      const handleCanPlay = () => setIsLoaded(true);
      const handlePlaying = () => {
        setIsPlaying(true);
        setIsLoaded(true);
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("playing", handlePlaying);
      video.addEventListener("loadeddata", handleCanPlay);

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("loadeddata", handleCanPlay);
      };
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
    <section className="hero-full-bleed relative w-full h-[100dvh] min-h-[640px] flex items-center justify-center overflow-hidden bg-black select-none">
      {/* ── Background Video ── */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out ${
          isLoaded ? "opacity-75" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        <source src="/kampung-cetak-hero.mp4" type="video/mp4" />
      </video>

      {/* Fallback gradient background during loading */}
      <div
        className={`absolute inset-0 bg-neutral-950 transition-opacity duration-1000 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* ── Cinematic Orbea Vignette & Gradient Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%] z-10 pointer-events-none" />

      {/* ── Main Banner Content (Centered, Bold, Orbea Hierarchy) ── */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-5xl mx-auto -mt-4 sm:-mt-6">
        {/* Orbea Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 text-white/90 text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.3)] mb-4 md:mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {label("Kampung Cetak® · Bespoke Printing", "Kampung Cetak® · Cetakan Khas")}
        </motion.div>

        {/* Main Headline - Orbea Large Impact Font */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[5.5rem] font-bold text-white tracking-[-0.03em] uppercase leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
        >
          {label("PRECISION PRINTING", "CETAKAN BERKUALITI")}
          <br />
          <span className="text-white/95 font-light">
            {label("& BESPOKE FABRICATION", "& PEMBUATAN KHAS")}
          </span>
        </motion.h1>

        {/* Sub-headline Narrative */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-neutral-200/90 max-w-2xl font-normal leading-relaxed text-center drop-shadow-sm mt-4 md:mt-6"
        >
          {label(
            "Premium commercial printing, bespoke packaging, signs & apparel. Factory direct with 48-hour nationwide delivery.",
            "Perkhidmatan percetakan premium untuk kad perniagaan, risalah, kain rentang, pakaian & pembungkusan khas. Buatan kilang terus dengan penghantaran 48 jam ke seluruh Malaysia."
          )}
        </motion.p>

        {/* Orbea Pill CTA Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto justify-center items-center"
        >
          <button
            onClick={() => router.push("/home/shop")}
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center px-8 py-3.5 sm:py-4 bg-white text-black font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-full hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            {label("Shop Now", "Beli Sekarang")}
          </button>
          <button
            onClick={() => router.push("/home/shop")}
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-md border border-white/35 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-full hover:bg-white/20 hover:border-white/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {label("Explore Products", "Jelajahi Produk")}
          </button>
        </motion.div>

        {/* Trust Indicators / Minimal Specs Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-white/15 w-full max-w-3xl"
        >
          {[
            { value: "48H", title: label("Express Delivery", "Penghantaran Pantas") },
            { value: "50+", title: label("Product Lines", "Kategori Produk") },
            { value: "100%", title: label("Quality Guarantee", "Jaminan Kualiti") },
            { value: "★ 4.9", title: label("Customer Rating", "Penilaian Pelanggan") },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                {item.value}
              </span>
              <span className="text-white/60 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mt-0.5">
                {item.title}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Video Controls (Mute / Play Toggle) ── */}
      <div className="absolute bottom-6 right-6 z-30 hidden sm:flex items-center gap-2">
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
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.25em]">
          {label("Scroll", "Gulung")}
        </span>
        <ChevronDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
};

export default Hero;