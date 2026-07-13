import React from "react";
import { motion } from "framer-motion";

interface BouncySkeletonProps {
  text?: string;
}

export function BouncySkeleton({ text = "Loading..." }: BouncySkeletonProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-8 relative overflow-hidden">
      {/* Background glowing orb for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[60px] z-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Floating / Bouncing Box */}
        <motion.div
          className="w-20 h-20 bg-gradient-to-br from-primary/80 to-primary/20 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary),0.3)] backdrop-blur-md border border-white/20 dark:border-white/10 flex items-center justify-center mb-6"
          animate={{
            y: [-15, 10, -15],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner floating shape */}
          <motion.div 
            className="w-8 h-8 bg-white/40 dark:bg-white/30 rounded-lg shadow-inner"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
              rotate: [0, -90, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>

        {/* Text over/below the bouncy box */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <h3 className="text-xl font-bold text-foreground/90 tracking-wider uppercase z-10 font-sans">
            {text}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">Please wait a moment...</p>
        </motion.div>
        
        {/* Shadow under the box */}
        <motion.div 
          className="w-16 h-2 bg-black/10 dark:bg-black/30 rounded-[100%] blur-[2px] mt-4 z-0"
          animate={{ 
            scale: [1, 0.7, 1],
            opacity: [0.4, 0.1, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}
